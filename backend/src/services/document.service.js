const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/document.repository');

function createError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

async function createDocument(file) {
  if (!file || file.size === 0) {
    if (file) {
      await documentRepository.removeUploadedFile(file.path).catch(() => {});
    }
    throw createError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.');
  }

  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
    owner: process.env.DEFAULT_OWNER || 'local-user',
    storagePath: file.path,
  };

  try {
    return documentRepository.save(document);
  } catch (error) {
    await documentRepository.removeUploadedFile(file.path).catch(() => {});
    throw error;
  }
}

function listDocuments() {
  const owner = process.env.DEFAULT_OWNER || 'local-user';
  return documentRepository.findByOwner(owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .map(documentRepository.toPublicDocument);
}

function findDocument(id) {
  const owner = process.env.DEFAULT_OWNER || 'local-user';
  return documentRepository.findByIdAndOwner(id, owner);
}

module.exports = { createDocument, listDocuments, findDocument };