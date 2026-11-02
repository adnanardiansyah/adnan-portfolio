import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../src/lib/neon.js', import.meta.url), 'utf8');

// Isolated environment + driver stub: these tests never load .env or contact Neon.
async function load(env = {}, query = async () => []) {
  const calls = [];
  const context = vm.createContext({ process: { env }, URL });
  const driver = new vm.SyntheticModule(['neon'], function () {
    this.setExport('neon', (...args) => { calls.push(args); return query; });
  }, { context });
  const boundary = new vm.SyntheticModule([], function () {}, { context });
  const subject = new vm.SourceTextModule(source, { context });
  await subject.link(specifier => {
    if (specifier === 'server-only') return boundary;
    if (specifier === '@neondatabase/serverless') return driver;
    throw new Error('Unexpected dependency');
  });
  await subject.evaluate();
  return { api: subject.namespace, calls };
}

const testUrl = 'postgresql://unit@unit.invalid/portfolio?sslmode=require';

test('import and configuration check perform no connection or query', async () => {
  const { api, calls } = await load({ DATABASE_URL: testUrl });
  assert.equal(api.isNeonConfigured(), true);
  assert.equal(calls.length, 0);
});

test('missing configuration fails without initializing the driver', async () => {
  const { api, calls } = await load();
  assert.equal(api.isNeonConfigured(), false);
  await assert.rejects(api.queryDatabase`SELECT 1`, /Database is not configured/);
  assert.equal(calls.length, 0);
});

test('invalid protocol or missing TLS is rejected with a generic error', async () => {
  for (const DATABASE_URL of ['invalid-private-value', 'https://unit.invalid/db?sslmode=require', 'postgresql://unit@unit.invalid/db']) {
    const { api, calls } = await load({ DATABASE_URL });
    await assert.rejects(api.queryDatabase`SELECT 1`, error => {
      assert.equal(error.message, 'Database configuration is invalid; check server environment');
      assert.equal(error.cause, undefined);
      return true;
    });
    assert.equal(calls.length, 0);
  }
});

test('request input stays a bound value and the lazy HTTP client is reused', async () => {
  const queries = [];
  const { api, calls } = await load({ DATABASE_URL: testUrl }, async (strings, ...values) => {
    queries.push({ strings: [...strings], values });
    return [{ id: 'snapnext' }];
  });
  const hostile = "' OR true; --";
  const result = await api.queryDatabase`SELECT id FROM portfolio.works WHERE id = ${hostile}`;
  await api.queryDatabase`SELECT 1`;
  assert.equal(result[0].id, 'snapnext');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].fetchOptions.cache, 'no-store');
  assert.deepEqual(queries[0].strings, ['SELECT id FROM portfolio.works WHERE id = ', '']);
  assert.equal(queries[0].values[0], hostile);
});

test('driver failures omit raw errors and connection details', async () => {
  const { api } = await load({ DATABASE_URL: testUrl }, async () => {
    throw new Error('raw database exception with private parameters');
  });
  await assert.rejects(api.queryDatabase`SELECT 1`, error => {
    assert.equal(error.message, 'Database query failed');
    assert.equal(error.cause, undefined);
    return true;
  });
});

test('ordinary string calls are rejected before driver initialization', async () => {
  const { api, calls } = await load({ DATABASE_URL: testUrl });
  await assert.rejects(api.queryDatabase('SELECT 1'), /must use a tagged template/);
  assert.equal(calls.length, 0);
});
