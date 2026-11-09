// Run after `npm run db:local` and `npm run cf:dev` (port 8787).
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const remote = process.argv.includes('--production');
const base = remote ? 'https://qr-restaurantes.jonycusac.workers.dev' : 'http://127.0.0.1:8787';
const key = remote ? readFileSync('.wrangler/admin-key.txt', 'utf8').trim() : readFileSync('.dev.vars', 'utf8').match(/^ADMIN_TOKEN=(.+)$/m)[1].trim();
async function request(path, method = 'GET', data, auth = true) {
  return fetch(base + path, { method, headers: { ...(auth ? { Authorization: `Bearer ${key}` } : {}), 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
}
assert.equal((await request('/')).status, 200);
assert.equal((await request('/api/restaurants', 'GET', undefined, false)).status, 401);
const slug = `verificacion-local-${Date.now()}`;
const response = await request('/api/restaurants', 'POST', { name: 'Prueba local Cloudflare', slug, targetUrl: 'https://example.com/carta', status: 'activo', notes: 'Privado' });
assert.equal(response.status, 201);
const row = await response.json();
try {
  const publicRow = await (await request(`/api/resolve/${slug}`, 'GET', undefined, false)).json();
  assert.equal(publicRow.targetUrl, 'https://example.com/carta');
  assert.equal(publicRow.notes, undefined);
  await request(`/api/scan/${slug}`, 'POST', undefined, false);
  assert.equal((await (await request('/api/restaurants')).json()).find(x => x.id === row.id).scanCount, 1);
  await request(`/api/restaurants/${row.id}`, 'PUT', { targetUrl: 'https://example.com/carta-nueva' });
  assert.equal((await (await request(`/api/resolve/${slug}`, 'GET', undefined, false)).json()).targetUrl, 'https://example.com/carta-nueva');
} finally {
  assert.equal((await request(`/api/restaurants/${row.id}`, 'DELETE')).status, 200);
}
assert.equal((await request(`/api/resolve/${slug}`, 'GET', undefined, false)).status, 404);
if (remote) {
  const settings = await (await request('/api/settings')).json();
  assert.equal(settings.baseUrl, base);
  const cors = await fetch(`${base}/api/restaurants`, { method: 'OPTIONS', headers: { Origin: 'https://jonycusac-bot.github.io', 'Access-Control-Request-Method': 'GET' } });
  assert.equal(cors.status, 204);
  assert.equal(cors.headers.get('Access-Control-Allow-Origin'), 'https://jonycusac-bot.github.io');
}
console.log(`${remote ? 'Producción' : 'Worker local'} y D1: frontend, autenticación, creación, consulta pública, conteo, edición y borrado correctos.`);
