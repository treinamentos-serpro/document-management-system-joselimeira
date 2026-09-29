const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const configuredMaxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES);

module.exports = {
  host: process.env.HOST || '127.0.0.1',
  port: process.env.PORT || 3000,
  storageDirectory: path.resolve(
    backendRoot,
    process.env.STORAGE_DIR || 'storage'
  ),
  defaultOwner: process.env.DEFAULT_OWNER || 'local-user',
  maxFileSizeBytes: Number.isSafeInteger(configuredMaxFileSize)
    && configuredMaxFileSize > 0
    ? configuredMaxFileSize
    : 10 * 1024 * 1024,
};