const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/document.controller');

const router = express.Router();
const backendRoot = path.resolve(__dirname, '../..');
const storageDirectory = path.resolve(
  backendRoot,
  process.env.STORAGE_DIR || 'storage'
);
const configuredMaxFileSize = Number.parseInt(process.env.MAX_FILE_SIZE_BYTES, 10);
const maxFileSize = Number.isSafeInteger(configuredMaxFileSize)
  && configuredMaxFileSize > 0
  ? configuredMaxFileSize
  : 10 * 1024 * 1024;

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
  limits: { fileSize: maxFileSize, files: 1 },
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

    res.status(500).json({
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Não foi possível enviar o arquivo.',
      },
    });
  });
}

router.post('/upload', handleUpload, documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;