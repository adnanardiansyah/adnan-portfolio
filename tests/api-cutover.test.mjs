import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import * as jose from 'jose';
import { NextResponse } from 'next/server.js';
import sharp from 'sharp';
import * as crypto from 'node:crypto';

// Execute real route/repository/validation code with an isolated SQL transport.
// These contract tests never load .env and cannot connect to any database.
async function fixture({ token, query = async () => [], configuration = {}, put, fetch } = {}) {
  const env = { JWT_SECRET: 'offline-test-key-with-at-least-32-bytes', ...configuration };
  const context = vm.createContext({ process: { env }, URL, TextEncoder, Response, Request, FormData, Buffer, console, fetch });
  const cache = new Map(), calls = [];
  const synthetic = (key, exports) => {
    if (!cache.has(key)) cache.set(key, new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context, identifier: key }));
    return cache.get(key);
  };
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const pending = (async () => {
    const subject = new vm.SourceTextModule(await readFile(file, 'utf8'), { context, identifier: file });
    await subject.link(async (specifier, ref) => {
      if (specifier === 'server-only') return synthetic(specifier, {});
      if (specifier === 'jose') return synthetic(specifier, jose);
      if (specifier === 'sharp') return synthetic(specifier, { default: sharp });
      if (specifier === 'node:crypto') return synthetic(specifier, crypto);
      if (specifier === '@vercel/blob') return synthetic(specifier, { put: put || (async () => { throw new Error('Real storage forbidden in offline test'); }) });
      if (specifier === 'next/headers') return synthetic(specifier, { cookies: async () => ({ get: () => token ? { value: token } : undefined }) });
      if (specifier === 'next/server') return synthetic(specifier, { NextResponse });
      const resolved = specifier.startsWith('@/') ? path.resolve('src', specifier.slice(2)) + '.js' : path.resolve(path.dirname(ref.identifier), specifier) + '.js';
      if (resolved === path.resolve('src/lib/neon.js')) return synthetic(resolved, { queryDatabase: async (strings, ...values) => {
        const sql = strings.join('?'); calls.push({ sql, values }); return query(sql, values);
      } });
      return load(resolved);
    });
    return subject;
    })();
    cache.set(file, pending);
    return pending;
  }
  const evaluate = async file => { const subject = await load(file); if (subject.status !== 'evaluated') await subject.evaluate(); return subject.namespace; };
  return { env, calls, module: evaluate, route: name => evaluate('src/app/api/' + name + '/route.js') };
}
const request = (route, method = 'GET', body, headers = {}) => new Request('http://localhost:3000/api/' + route, { method, headers: { 'content-type': 'application/json', ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
async function adminToken(payload = { admin: true }) {
  return new jose.SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('5m').sign(new TextEncoder().encode('offline-test-key-with-at-least-32-bytes'));
}

test('healthy empty database stays empty; hidden/deleted detail never uses local seed', async () => {
  const f = await fixture();
  const list = await (await f.route('works')).GET(request('works'));
  assert.deepEqual(await list.json(), []);
  assert.equal(list.headers.get('X-Portfolio-Source'), 'neon');
  const detail = await (await f.route('works/[id]')).GET(request('works/snapnext'), { params: Promise.resolve({ id: 'snapnext' }) });
  assert.equal(detail.status, 404);
});

test('database outage uses four local projects only for public reads', async () => {
  const f = await fixture({ query: async () => { throw new Error('private transport detail'); } });
  const response = await (await f.route('works')).GET(request('works'));
  assert.equal(response.headers.get('X-Portfolio-Source'), 'fallback');
  assert.equal((await response.json()).length, 4);
  const detail = await (await f.route('works/[id]')).GET(request('works/snapnext'), { params: { id: 'snapnext' } });
  assert.equal((await detail.json()).title, 'SnapNext');
  const admin = await fixture({ token: await adminToken(), query: async () => { throw new Error('private transport detail'); } });
  const adminResponse = await (await admin.route('works')).GET(request('works?all=true'));
  assert.equal(adminResponse.status, 503);
  assert.ok(!JSON.stringify(await adminResponse.json()).includes('private transport'));
});

test('mutations, private lists and invalid admin claims are rejected before SQL', async () => {
  for (const token of [undefined, await adminToken({ admin: false })]) {
    const f = await fixture({ token });
    for (const route of ['works', 'projects', 'reviews', 'settings']) {
      const handlers = await f.route(route);
      const response = await handlers[route === 'settings' ? 'PATCH' : 'POST'](request(route, route === 'settings' ? 'PATCH' : 'POST', { title: 'isolated fixture' }));
      assert.equal(response.status, 401);
    }
    const response = await (await f.route('inquiries')).GET(request('inquiries'));
    assert.equal(response.status, 401);
    assert.equal(f.calls.length, 0);
  }
});

test('unknown fields, unsafe URLs, retired titles and cross-site mutations are rejected', async () => {
  const f = await fixture({ token: await adminToken() });
  const handler = (await f.route('works')).POST;
  for (const body of [{ title: 'QA', id: 'injected' }, { title: 'QA', link: 'javascript:alert(1)' }, { title: 'Regal Stay' }, { title: 'QA', visible: 'false' }]) {
    assert.equal((await handler(request('works', 'POST', body))).status, 400);
  }
  assert.equal((await handler(request('works', 'POST', { title: 'QA' }, { origin: 'https://foreign.invalid' }))).status, 403);
  assert.equal(f.calls.length, 0);
});

test('create/update keep hostile input in bound JSON and preserve response aliases', async () => {
  const value = "QA '); DROP TABLE portfolio.works; --";
  const f = await fixture({ token: await adminToken(), query: async () => [{ id: 'qa-temporary', title: value, category: 'App', image_fit: 'contain', gallery_layout: 'mobile' }] });
  const created = await (await f.route('works')).POST(request('works', 'POST', { title: value }));
  assert.equal(created.status, 201);
  const row = await created.json();
  assert.equal(row.imageFit, 'contain'); assert.equal(row.galleryLayout, 'mobile');
  assert.equal(f.calls[0].sql.includes(value), false);
  assert.equal(JSON.parse(f.calls[0].values[0]).title, value);
  const patched = await (await f.route('works/[id]')).PATCH(request('works/qa-temporary', 'PATCH', { visible: false }), { params: { id: 'qa-temporary' } });
  assert.equal(patched.status, 200);
  assert.equal(JSON.parse(f.calls.at(-1).values[0]).visible, false);
});

test('private settings are never exposed and upload never returns false success', async () => {
  const f = await fixture({ token: await adminToken() });
  const response = await (await f.route('settings')).GET(request('settings?key=active_sessions'));
  assert.equal(response.status, 404);
  const upload = await (await f.route('upload')).POST(request('upload', 'POST', {}));
  assert.equal(upload.status, 400);
  assert.equal((await upload.json()).url, undefined);
  assert.equal(f.calls.length, 0);
});

test('multipart upload rejects anonymous, forged types, URLs and oversized files without storage', async () => {
  const f = await fixture({ token: await adminToken() });
  const handler = (await f.route('upload')).POST;
  const send = async (file, extra = false) => {
    const body = new FormData(); body.set('file', file);
    if (extra) body.set('path', '../unsafe');
    return handler(new Request('http://localhost/api/upload', { method: 'POST', body }));
  };
  assert.equal((await send(new File(['<svg/>'], 'fake.svg', { type: 'image/svg+xml' }))).status, 400);
  assert.equal((await send(new File(['fake'], 'fake.png', { type: 'image/png' }))).status, 400);
  assert.equal((await send(new File([new Uint8Array(3 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }))).status, 400);
  const png = await sharp({ create: { width: 30, height: 60, channels: 3, background: '#123456' } }).png().toBuffer();
  const file = new File([png], '../../unsafe.png', { type: 'image/png' });
  assert.equal((await send(file, true)).status, 400);
  assert.equal((await send(file)).status, 503); // Valid image, no real storage config.
  assert.equal(f.calls.length, 0);
  const anonymous = await fixture();
  const body = new FormData(); body.set('file', file);
  assert.equal((await (await anonymous.route('upload')).POST(new Request('http://localhost/api/upload', { method: 'POST', body }))).status, 401);
});

test('image normalization preserves desktop/mobile dimensions and uses decoded content', async () => {
  const f = await fixture(); const { prepareImage } = await f.module('src/lib/blob-storage.js');
  for (const [width, height] of [[120, 60], [36, 81]]) {
    const png = await sharp({ create: { width, height, channels: 3, background: '#123456' } }).png().toBuffer();
    const output = await prepareImage(new File([png], 'input.png', { type: 'image/png' }));
    const result = await sharp(output).metadata(); assert.equal(result.width, width); assert.equal(result.height, height); assert.equal(result.format, 'webp');
    await assert.rejects(prepareImage(new File([png], 'fake.jpg', { type: 'image/jpeg' })), /Isi gambar tidak valid/);
  }
});

test('upload ledger precedes storage; database failure never uploads or deletes older assets', async () => {
  let uploads = 0;
  const configuration = { BLOB_READ_WRITE_TOKEN: 'offline-unit-test-only', BLOB_PUBLIC_HOSTNAME: 'unit.public.blob.vercel-storage.com' };
  const f = await fixture({ configuration, query: async () => { throw new Error('offline DB failure'); }, put: async () => { uploads++; } });
  await assert.rejects((await f.module('src/lib/blob-storage.js')).storeImage(Buffer.from('offline fixture')));
  assert.equal(uploads, 0);
  const g = await fixture({ configuration, query: async () => [], put: async (pathname, bytes, options) => {
    uploads++; assert.match(pathname, /^portfolio\/projects\/[a-f0-9-]+\.webp$/); assert.equal(options.allowOverwrite, false); return { url: 'https://unit.public.blob.vercel-storage.com/' + pathname };
  } });
  const result = await (await g.module('src/lib/blob-storage.js')).storeImage(Buffer.from('offline fixture'));
  assert.match(result.url, /^https:\/\/unit\.public\.blob\.vercel-storage\.com\//); assert.equal(uploads, 1); assert.match(g.calls[0].sql, /INSERT INTO portfolio.settings/); assert.equal(g.calls.length, 2);
  let databaseCalls = 0;
  const interrupted = await fixture({ configuration, query: async () => { if (++databaseCalls === 2) throw new Error('DB unavailable after put'); return []; }, put: async pathname => ({ url: 'https://unit.public.blob.vercel-storage.com/' + pathname }) });
  await assert.rejects((await interrupted.module('src/lib/blob-storage.js')).storeImage(Buffer.from('offline fixture')), /Upload belum dapat dipastikan/);
  assert.equal(interrupted.calls.length, 2); // Reservation remains; no DELETE statement.
  assert(interrupted.calls.every(call => !/DELETE FROM/.test(call.sql)));
});

test('client previews upload on save only; retry reuses URLs after simulated DB failure', async () => {
  let uploads = 0;
  const f = await fixture({ fetch: async () => { uploads++; return Response.json({ url: 'https://unit.public.blob.vercel-storage.com/portfolio/projects/unit.webp' }); } });
  const batch = (await f.module('src/lib/upload-images.js')).createImageBatch();
  const preview = batch.select(new File(['unit'], 'unit.png', { type: 'image/png' }));
  assert.equal(uploads, 0);
  const first = await batch.resolveForm({ image_url: preview, gallery: [preview, '/images/projects/snapnext/cover.webp'] });
  assert.equal(uploads, 1); // Shared selection in cover/gallery uploads once.
  // A failed metadata request leaves this same batch alive for a retry.
  const retry = await batch.resolveForm({ image_url: preview, gallery: [preview] });
  assert.equal(retry.image_url, first.image_url); assert.equal(uploads, 1);
  await batch.resolveForm({ image_url: '', gallery: [] }); assert.equal(uploads, 1);
  batch.reset();
});
