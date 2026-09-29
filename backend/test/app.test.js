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

test('upload, listagem e download funcionam com storage local', async () => {
  const form = new FormData();
  form.append('file', new Blob(['document body'], { type: 'text/plain' }), 'hello.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });
  assert.equal(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.equal(document.originalName, 'hello.txt');
  assert.equal(document.size, 13);
  assert.equal(Object.hasOwn(document, 'storagePath'), false);

  const storedFiles = fs.readdirSync(storageDirectory);
  assert.equal(storedFiles.length, 1);
  assert.equal(
    fs.readFileSync(path.join(storageDirectory, storedFiles[0]), 'utf8'),
    'document body'
  );

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual((await listResponse.json()).documents, [document]);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`
  );
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /hello\.txt/);
  assert.equal(await downloadResponse.text(), 'document body');
});
