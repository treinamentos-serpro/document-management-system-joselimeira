import { useRef, useState } from 'react';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadComponent({ onUpload, isUploading }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState('');

  function chooseFile(file) {
    setValidationError('');
    if (file && file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setValidationError('O arquivo excede o limite de 10 MiB.');
      return;
    }
    setSelectedFile(file || null);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    if (!isUploading) chooseFile(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) return;

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      // A página apresenta o erro da requisição.
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-heading">
      <div className="upload-heading">
        <p className="eyebrow">ADICIONAR AO ARQUIVO</p>
        <h2 id="upload-heading">Enviar documento</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          onChange={(event) => chooseFile(event.target.files[0])}
          disabled={isUploading}
          aria-label="Selecionar arquivo para envio"
        />
        <button
          className={`drop-zone${isDragging ? ' is-dragging' : ''}`}
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <span className="upload-mark" aria-hidden="true">↑</span>
          <span className="drop-title">Arraste um arquivo para cá</span>
          <span className="drop-caption">ou clique para escolher</span>
        </button>

        {selectedFile && (
          <div className="selected-file">
            <span className="selected-file-name" title={selectedFile.name}>
              {selectedFile.name}
            </span>
            <span>{formatFileSize(selectedFile.size)}</span>
            <button
              className="remove-file"
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              disabled={isUploading}
              aria-label="Remover arquivo selecionado"
              title="Remover arquivo"
            >
              ×
            </button>
          </div>
        )}

        {validationError && <p className="inline-error" role="alert">{validationError}</p>}
        <p className="upload-limit">Tamanho máximo: 10 MiB</p>
        <button className="primary-button upload-submit" type="submit" disabled={!selectedFile || isUploading}>
          {isUploading ? (
            <><span className="button-spinner" aria-hidden="true" /> Enviando...</>
          ) : (
            <><span aria-hidden="true">↑</span> Enviar arquivo</>
          )}
        </button>
      </form>
    </section>
  );
}