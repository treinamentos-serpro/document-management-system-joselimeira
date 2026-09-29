export default function DownloadButton({ document, onDownload, disabled }) {
  return (
    <button
      className="icon-button download-button"
      type="button"
      onClick={() => onDownload(document)}
      disabled={disabled}
      aria-label={`Baixar ${document.originalName}`}
      title="Baixar documento"
    >
      <span aria-hidden="true">↓</span>
      <span className="download-label">Baixar</span>
    </button>
  );
}