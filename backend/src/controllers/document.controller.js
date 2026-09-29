const documentService = require('../services/document.service');
const { maxFileSizeBytes } = require('../config');

function sendError(res, error, fallback) {
  const isEmptyFile = error.code === 'EMPTY_FILE';
  const status = isEmptyFile ? 400 : error.statusCode || fallback.statusCode;
  const code = isEmptyFile ? 'FILE_REQUIRED' : error.code || fallback.code;
  const message = isEmptyFile
    ? 'Envie um arquivo no campo file.'
    : error.statusCode
      ? error.message
      : fallback.message;

  res.status(status).json({ error: { code, message } });
}

function upload(req, res) {
  documentService.createDocument(req.file)
    .then((document) => res.status(201).json({ document }))
    .catch((error) => sendError(res, error, {
      statusCode: 500,
      code: 'UPLOAD_FAILED',
      message: 'Não foi possível enviar o arquivo.',
    }));
}

function list(req, res) {
  res.json({ documents: documentService.listDocuments() });
}

function uploadConfig(req, res) {
  res.json({ maxFileSizeBytes });
}

function download(req, res) {
  const document = documentService.findDocument(req.params.id);
  if (!document) {
    res.status(404).json({
      error: {
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.',
      },
    });
    return;
  }

  const mimeType = /^[\w!#$&^_.+-]+\/[\w!#$&^_.+-]+$/.test(document.mimeType)
    ? document.mimeType
    : 'application/octet-stream';

  res.download(document.storagePath, document.originalName, {
    headers: { 'Content-Type': mimeType },
  }, (error) => {
    if (!error) {
      return;
    }

    if (res.headersSent) {
      res.destroy(error);
      return;
    }

    sendError(res, error, {
      statusCode: 500,
      code: 'DOWNLOAD_FAILED',
      message: 'Não foi possível baixar o documento.',
    });
  });
}

module.exports = { upload, list, download, uploadConfig };