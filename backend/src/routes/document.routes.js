const express = require('express');
const documentController = require('../controllers/document.controller');
const { handleUpload } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/upload', handleUpload, documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

router.get('/upload-config', documentController.uploadConfig);
module.exports = router;

module.exports = router;