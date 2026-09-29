const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const configuredMaxFileSize = Number.parseInt(process.env.MAX_FILE_SIZE_BYTES, 10);

module.exports = {
  storageDirectory: path.resolve(
    backendRoot,
    process.env.STORAGE_DIR || 'storage'
  ),
  maxFileSizeBytes: Number.isSafeInteger(configuredMaxFileSize)
    && configuredMaxFileSize > 0
    ? configuredMaxFileSize
    : 10 * 1024 * 1024,
  defaultOwner: process.env.DEFAULT_OWNER || 'local-user',
};