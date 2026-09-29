import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({
  documents,
  isLoading,
  onDownload,
  downloadingId,
  filter,
  onFilterChange,
  onRetry,
}) {
  const filteredDocuments = documents.filter((document) =>
    document.originalName.toLocaleLowerCase('pt-BR')
      .includes(filter.trim().toLocaleLowerCase('pt-BR'))
  );

  return (
    <section className="documents-section" aria-labelledby="documents-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ARQUIVO LOCAL</p>
          <h2 id="documents-heading">Seus documentos</h2>
        </div>
        <label className="search-field">
          <span className="visually-hidden">Filtrar documentos</span>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Filtrar por nome"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="list-message" role="status">
          <span className="loading-mark" aria-hidden="true" />
          <span>Carregando documentos...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">↗</span>
          <h3>Nenhum documento ainda</h3>
          <p>Os arquivos enviados aparecerão nesta lista.</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="list-message">Nenhum documento corresponde a esse nome.</div>
      ) : (
        <>
          <div className="document-table" role="table" aria-label="Documentos">
            <div className="document-row document-header" role="row">
              <span role="columnheader">Nome</span>
              <span role="columnheader">Tamanho</span>
              <span role="columnheader">Enviado em</span>
              <span className="visually-hidden" role="columnheader">Ações</span>
            </div>
            {filteredDocuments.map((document) => (
              <div className="document-row" role="row" key={document.id}>
                <div className="document-name" role="cell">
                  <span className="file-mark" aria-hidden="true">DOC</span>
                  <span className="file-name" title={document.originalName}>
                    {document.originalName}
                  </span>
                </div>
                <span className="document-meta" role="cell">
                  {formatFileSize(document.size)}
                </span>
                <time
                  className="document-meta document-date"
                  role="cell"
                  dateTime={document.uploadedAt}
                >
                  {formatDate(document.uploadedAt)}
                </time>
                <span className="document-action" role="cell">
                  <DownloadButton
                    document={document}
                    onDownload={onDownload}
                    disabled={downloadingId === document.id}
                  />
                </span>
              </div>
            ))}
          </div>
          {onRetry && (
            <button className="text-button list-retry" type="button" onClick={onRetry}>
              Tentar carregar novamente
            </button>
          )}
        </>
      )}
    </section>
  );
}