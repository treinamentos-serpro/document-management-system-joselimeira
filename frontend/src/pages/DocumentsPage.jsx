import { useEffect, useState } from 'react';
import DocumentList from '../components/DocumentList.jsx';
import UploadComponent from '../components/UploadComponent.jsx';
import {
  downloadDocument,
  listDocuments,
  uploadDocument,
} from '../services/documentService.js';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('');

  async function refreshDocuments({ initial = false } = {}) {
    if (initial) setIsLoading(true);
    setError('');
    try {
      setDocuments(await listDocuments());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshDocuments({ initial: true });
  }, []);

  async function handleUpload(file) {
    setIsUploading(true);
    setError('');
    setNotice('');
    try {
      await uploadDocument(file);
      await refreshDocuments();
      setNotice('Documento enviado.');
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document) {
    setDownloadingId(document.id);
    setError('');
    setNotice('');
    try {
      await downloadDocument(document);
      setNotice(`Download iniciado: ${document.originalName}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="brand-word">DMS<span> / ARQUIVO</span></span>
        </a>
        <div className="environment-indicator">
          <span className="status-dot" />
          <span>Espaço local</span>
        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">GESTÃO DE ARQUIVOS</p>
            <h1>Documentos</h1>
            <p className="page-description">
              {isLoading
                ? 'Carregando arquivo...'
                : `${documents.length} ${documents.length === 1 ? 'documento' : 'documentos'} no arquivo`}
            </p>
          </div>
          <button
            className="refresh-button"
            type="button"
            onClick={() => refreshDocuments({ initial: true })}
            disabled={isLoading}
            title="Atualizar lista"
            aria-label="Atualizar lista"
          >
            <span aria-hidden="true">↻</span>
          </button>
        </div>

        {error && (
          <div className="notice notice-error" role="alert">
            <span>{error}</span>
            <button
              className="notice-action"
              type="button"
              onClick={() => refreshDocuments({ initial: true })}
            >
              Tentar novamente
            </button>
          </div>
        )}
        {notice && !error && (
          <div className="notice notice-success" role="status">
            <span className="notice-check" aria-hidden="true">✓</span>
            <span>{notice}</span>
            <button
              className="notice-dismiss"
              type="button"
              onClick={() => setNotice('')}
              aria-label="Dispensar aviso"
            >
              ×
            </button>
          </div>
        )}

        <div className="content-grid">
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDownload={handleDownload}
            downloadingId={downloadingId}
            filter={filter}
            onFilterChange={setFilter}
          />
          <UploadComponent onUpload={handleUpload} isUploading={isUploading} />
        </div>
      </main>
      <footer className="app-footer">
        <span>DMS</span>
        <span>Armazenamento local</span>
      </footer>
    </div>
  );
}