const fs = require('node:fs/promises');

const documents = new Map();

function toPublicDocument(document) {
  const { storagePath, ...publicDocument } = document;
  return publicDocument;
}

function save(document) {
  documents.set(document.id, document);
  return toPublicDocument(document);
}

function findByOwner(owner) {
  return [...documents.values()].filter((document) => document.owner === owner);
}

function findByIdAndOwner(id, owner) {
  const document = documents.get(id);
  return document && document.owner === owner ? document : null;
}

function removeUploadedFile(filePath) {
  return fs.unlink(filePath);
}

module.exports = {
  save,
  findByOwner,
  findByIdAndOwner,
  removeUploadedFile,
  toPublicDocument,
};