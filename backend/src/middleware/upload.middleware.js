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
  },
});

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'O arquivo excede o limite de tamanho permitido.',
        },
      });
      return;
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        error: {
          code: 'FILE_REQUIRED',
          message: 'Envie um arquivo no campo file.',
        },
      });
      return;
    }

    if (error.code === 'LIMIT_FIELD_COUNT' || error.code === 'LIMIT_PART_COUNT') {
      res.status(400).json({
        error: {
          code: 'INVALID_MULTIPART',
          message: 'A requisição deve conter somente o arquivo no campo file.',
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Não foi possível enviar o arquivo.',
      },
    });
  });
}

module.exports = { handleUpload };