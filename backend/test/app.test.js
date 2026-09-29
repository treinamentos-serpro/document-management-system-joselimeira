const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_FILE_SIZE_BYTES = '1024';

const app = require('../src/app');
const server = http.createServer(app);
let baseUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  fs.rmSync(storageDirectory, { recursive: true, force: true });
});

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('GET /health continua disponível', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('POST /upload exige um arquivo no campo file', async () => {
  const response = await fetch(`${baseUrl}/upload`, { method: 'POST' });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: {
      code: 'FILE_REQUIRED',
      message: 'Envie um arquivo no campo file.',
    },
  });
});

test('POST /upload rejeita arquivo vazio e remove o arquivo temporário', async () => {
  const form = new FormData();
  form.append('file', new Blob([]), 'empty.txt');

  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'FILE_REQUIRED');
  assert.deepEqual(fs.readdirSync(storageDirectory), []);
});

test('POST /upload rejeita arquivos acima do limite', async () => {
  const form = new FormData();
  form.append('file', new Blob(['x'.repeat(2048)]), 'large.txt');

  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
});

test('upload, listagem e download usam storage local e metadados públicos', async () => {
  const form = new FormData();
  form.append('file', new Blob(['document body'], { type: 'text/plain' }), 'hello.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.equal(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.equal(document.originalName, 'hello.txt');
  assert.equal(document.size, 13);
  assert.equal(document.owner, 'local-user');
  assert.equal(Object.hasOwn(document, 'storagePath'), false);

  const storedFiles = fs.readdirSync(storageDirectory);
  assert.equal(storedFiles.length, 1);
  assert.equal(storedFiles[0], path.basename(storedFiles[0]));
  assert.equal(fs.readFileSync(path.join(storageDirectory, storedFiles[0]), 'utf8'), 'document body');

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual((await listResponse.json()).documents, [document]);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /hello\.txt/);
  assert.equal(await downloadResponse.text(), 'document body');
});

test('GET /documents/:id/download retorna 404 para ID inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/not-a-document/download`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
});
