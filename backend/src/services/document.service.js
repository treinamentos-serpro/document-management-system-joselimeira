const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/document.repository');
const { defaultOwner } = require('../config');

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function removeUploadedFileBestEffort(filePath) {
  if (!filePath) return;

  try {
    await documentRepository.removeUploadedFile(filePath);
  } catch {}
}

function buildDocument(file) {
  return {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
    owner: defaultOwner,
    storagePath: file.path,
  };
}

async function createDocument(file) {
  if (!file || file.size === 0) {
    await removeUploadedFileBestEffort(file?.path);
    throw createError('EMPTY_FILE', 'O arquivo enviado está vazio ou ausente.');
  }

  const document = buildDocument(file);

  try {
    return documentRepository.save(document);
  } catch (error) {
    await removeUploadedFileBestEffort(file.path);
    throw error;
  }
}

function listDocuments() {
  return documentRepository.findByOwner(defaultOwner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .map(documentRepository.toPublicDocument);
}

function findDocument(id) {
  return documentRepository.findByIdAndOwner(id, defaultOwner);
}

module.exports = { createDocument, listDocuments, findDocument };