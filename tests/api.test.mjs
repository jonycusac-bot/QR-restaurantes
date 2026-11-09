import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../worker/index.ts';
let db, env;
const token = 'test-admin-token-with-at-least-32-characters';
const sample = { name: 'Mesón de prueba', slug: 'prueba', targetUrl: 'https://example.com/menu', status: 'activo', notes: 'Solo administración' };
beforeEach(() => {
  db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
  const wrap = (sql, values = []) => ({
    bind: (...args) => wrap(sql, args),
    first: async () => db.prepare(sql).get(...values) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...values) }),
    run: async () => db.prepare(sql).run(...values),
  });
  env = { ADMIN_TOKEN: token, DB: { prepare: wrap, batch: async statements => {
    db.exec('BEGIN'); try { for (const s of statements) await s.run(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
  } }, ASSETS: { fetch: async () => new Response('frontend') } };
});
afterEach(() => db.close());
const request = (path, method = 'GET', data, auth = true, origin) => worker.fetch(new Request(`https://qr.example/api${path}`, {
  method, headers: { ...(auth ? { Authorization: `Bearer ${token}` } : {}), ...(origin ? { Origin: origin } : {}), 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data)
}), env);
test('administration requires a configured valid token; public lookup remains available', async () => {
  assert.equal((await request('/restaurants', 'GET', undefined, false)).status, 401);
  assert.equal((await request('/restaurants', 'POST', sample, false)).status, 401);
  assert.equal((await request('/resolve/missing', 'GET', undefined, false)).status, 404);
  env.ADMIN_TOKEN = '';
  assert.equal((await request('/restaurants')).status, 503);
});
test('create, resolve on another client, edit without changing the printed QR, pause and delete', async () => {
  const created = await request('/restaurants', 'POST', sample); assert.equal(created.status, 201);
  const row = await created.json();
  let publicRow = await (await request('/resolve/prueba', 'GET', undefined, false)).json();
  assert.equal(publicRow.targetUrl, sample.targetUrl); assert.equal(publicRow.notes, undefined);
  assert.equal((await request('/restaurants', 'POST', sample)).status, 409);
  assert.equal((await request(`/restaurants/${row.id}`, 'PUT', { slug: 'other' })).status, 400);
  await request('/scan/prueba', 'POST', undefined, false);
  await Promise.all(Array.from({ length: 5 }, () => request('/scan/prueba', 'POST', undefined, false)));
  assert.equal((await (await request('/restaurants')).json())[0].scanCount, 6);
  await request(`/restaurants/${row.id}`, 'PUT', { targetUrl: 'https://example.com/new' });
  publicRow = await (await request('/resolve/prueba', 'GET', undefined, false)).json();
  assert.equal(publicRow.targetUrl, 'https://example.com/new');
  await request(`/restaurants/${row.id}`, 'PUT', { status: 'pausado' });
  assert.equal((await (await request('/resolve/prueba', 'GET', undefined, false)).json()).targetUrl, undefined);
  await request('/scan/prueba', 'POST', undefined, false);
  assert.equal((await (await request('/restaurants')).json())[0].scanCount, 6);
  assert.equal((await request(`/restaurants/${row.id}`, 'DELETE')).status, 200);
  assert.equal((await request('/resolve/prueba', 'GET', undefined, false)).status, 404);
});
test('rejects unsafe URLs, invalid input and unapproved origins', async () => {
  for (const targetUrl of ['javascript:alert(1)', 'data:text/html,test', 'https://user:secret@example.com']) assert.equal((await request('/restaurants', 'POST', { ...sample, targetUrl })).status, 400);
  assert.equal((await request('/restaurants', 'POST', { ...sample, slug: '' })).status, 400);
  assert.equal((await request('/restaurants', 'GET', undefined, true, 'https://evil.example')).status, 403);
  env.ALLOWED_ORIGIN = 'https://jonycusac-bot.github.io';
  const response = await request('/restaurants', 'GET', undefined, true, env.ALLOWED_ORIGIN);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), env.ALLOWED_ORIGIN);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await request('/restaurants', 'OPTIONS', undefined, false, env.ALLOWED_ORIGIN)).status, 204);
});
test('imports legacy backup atomically, preserves counters and does not overwrite existing restaurants', async () => {
  const legacy = { ...sample, id: 'old', scanCount: 42, createdAt: '2026-10-01T12:00:00Z', updatedAt: '2026-10-02T12:00:00Z' };
  assert.equal((await request('/import', 'POST', { restaurants: [legacy] })).status, 200);
  assert.equal((await request('/import', 'POST', { restaurants: [{ ...legacy, name: 'Overwrite' }] })).status, 200);
  const rows = await (await request('/restaurants')).json(); assert.equal(rows.length, 1); assert.equal(rows[0].scanCount, 42); assert.equal(rows[0].name, sample.name);
  const invalid = await request('/import', 'POST', { restaurants: [{ ...legacy, slug: 'new' }, { ...legacy, slug: 'bad', targetUrl: 'javascript:x' }] });
  assert.equal(invalid.status, 400); assert.equal((await (await request('/restaurants')).json()).length, 1);
  assert.equal((await request('/import', 'POST', { restaurants: [legacy, legacy] })).status, 400);
});
test('settings persist and validate the public address', async () => {
  assert.equal(await (await request('/settings')).json(), null);
  const config = { baseUrl: 'https://jonycusac-bot.github.io/QR-restaurantes', githubUsername: 'jonycusac-bot', githubRepo: 'QR-restaurantes', githubBranch: 'main' };
  assert.equal((await request('/settings', 'PUT', config)).status, 200);
  assert.deepEqual(await (await request('/settings')).json(), config);
  assert.equal((await request('/settings', 'PUT', { ...config, baseUrl: 'javascript:x' })).status, 400);
});
