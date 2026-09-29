const API_BASE = '/api';

async function throwResponseError(response, fallback) {
  const payload = await response.json().catch(() => null);
  throw new Error(payload?.error?.message || fallback);
}

export async function listDocuments() {
  const response = await fetch(`${API_BASE}/documents`);
  if (!response.ok) {
    await throwResponseError(response, 'Não foi possível carregar os documentos.');
  }

  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    await throwResponseError(response, 'Não foi possível enviar o documento.');
  }

  const payload = await response.json();
  return payload.document;
}

export async function downloadDocument(document) {
  const response = await fetch(
    `${API_BASE}/documents/${encodeURIComponent(document.id)}/download`
  );
  if (!response.ok) {
    await throwResponseError(response, 'Não foi possível baixar o documento.');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}