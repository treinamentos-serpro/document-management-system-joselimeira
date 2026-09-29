const crypto = require('node:crypto');
const fs = require('node:fs');
const multer = require('multer');
const { maxFileSizeBytes, storageDirectory } = require('../config');

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, crypto.randomUUID());
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
    files: 1,
    fields: 0,
    parts: 2,
    fieldNameSize: 100,
    fieldSize: 1024,
  },
});

function sendUploadError(res, statusCode, code, message) {
  res.status(statusCode).json({ error: { code, message } });
}

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      sendUploadError(
        res,
        413,
        'FILE_TOO_LARGE',
        'O arquivo excede o limite de tamanho permitido.'
      );
      return;
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      sendUploadError(
        res,
        400,
        'FILE_REQUIRED',
        'Envie um único arquivo no campo file.'
      );
      return;
    }

    if ([
      'LIMIT_FIELD_COUNT',
      'LIMIT_PART_COUNT',
      'LIMIT_FIELD_VALUE',
      'LIMIT_FIELD_KEY',
    ].includes(error.code)) {
      sendUploadError(
        res,
        400,
        'INVALID_MULTIPART',
        'A requisição deve conter somente o arquivo no campo file.'
      );
      return;
    }

    sendUploadError(res, 500, 'UPLOAD_FAILED', 'Não foi possível enviar o arquivo.');
  });
}

module.exports = { handleUpload };