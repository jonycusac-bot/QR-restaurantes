interface Statement {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
interface Env {
  DB: { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown> };
  ASSETS: { fetch(request: Request): Promise<Response> };
  ADMIN_TOKEN?: string;
  ALLOWED_ORIGIN?: string;
}
const columns = 'id, name, slug, targetUrl, status, scanCount, createdAt, updatedAt, lastScanAt, notes';
const json = (data: unknown, status = 200) => Response.json(data, { status });
const fail = (message: string, status = 400): never => { throw new Response(JSON.stringify({ error: message }), { status, headers: { 'Content-Type': 'application/json' } }); };
function textField(value: unknown, max: number, required = true): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail('Campo de texto inválido.');
  return (value as string).trim();
}
function validate(data: any) {
  const name = textField(data.name, 200);
  const slug = textField(data.slug, 120).toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(slug)) fail('Identificador inválido.');
  const targetUrl = textField(data.targetUrl, 2048);
  let url: URL;
  try { url = new URL(targetUrl); } catch { fail('URL inválida.'); }
  if (!['https:', 'http:'].includes(url!.protocol) || url!.username || url!.password) fail('La URL debe usar HTTP o HTTPS y no contener credenciales.');
  if (!['activo', 'pausado'].includes(data.status)) fail('Estado inválido.');
  return { name, slug, targetUrl: url!.href, status: data.status, notes: textField(data.notes ?? '', 2000, false) };
}
function validateSettings(data: any) {
  const baseUrl = textField(data.baseUrl, 2048);
  let url: URL;
  try { url = new URL(baseUrl); } catch { fail('Dirección pública inválida.'); }
  if (!['https:', 'http:'].includes(url!.protocol) || url!.search || url!.hash || url!.username || url!.password) fail('Dirección pública inválida.');
  return { baseUrl: baseUrl.replace(/\/$/, ''), githubUsername: textField(data.githubUsername ?? '', 100, false), githubRepo: textField(data.githubRepo ?? '', 100, false), githubBranch: textField(data.githubBranch ?? 'main', 100) };
}
async function body(request: Request) {
  const raw = await request.text();
  if (raw.length > 1_000_000) fail('Archivo demasiado grande.', 413);
  try { const data = JSON.parse(raw); if (!data || typeof data !== 'object' || Array.isArray(data)) fail('JSON inválido.'); return data; } catch { fail('JSON inválido.'); }
}
async function authorize(request: Request, env: Env) {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 32) fail('Administración sin configurar.', 503);
  const candidate = request.headers.get('Authorization') ?? '';
  const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  const [a, b] = await Promise.all([digest(candidate), digest(`Bearer ${env.ADMIN_TOKEN}`)]);
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff) fail('Clave de administración incorrecta.', 401);
}
async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/')) return env.ASSETS.fetch(request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  // Public resolver exposes only the data needed by customers, never internal notes.
  if (path.startsWith('/api/resolve/') && request.method === 'GET') {
    const slug = decodeURIComponent(path.slice('/api/resolve/'.length));
    const row = await env.DB.prepare('SELECT name, slug, targetUrl, status FROM restaurants WHERE slug = ?').bind(slug).first<any>();
    if (!row) fail('Restaurante no encontrado.', 404);
    if (row.status !== 'activo') delete row.targetUrl;
    return json(row);
  }
  if (path.startsWith('/api/scan/') && request.method === 'POST') {
    const slug = decodeURIComponent(path.slice('/api/scan/'.length));
    await env.DB.prepare("UPDATE restaurants SET scanCount = scanCount + 1, lastScanAt = ? WHERE slug = ? AND status = 'activo'").bind(new Date().toISOString(), slug).run();
    return json({ ok: true });
  }
  await authorize(request, env);
  if (path === '/api/restaurants' && request.method === 'GET') return json((await env.DB.prepare(`SELECT ${columns} FROM restaurants ORDER BY createdAt DESC`).all()).results);
  if (path === '/api/settings' && request.method === 'GET') {
    const row = await env.DB.prepare('SELECT value FROM settings WHERE id = 1').first<{ value: string }>();
    return json(row ? JSON.parse(row.value) : null);
  }
  if (path === '/api/settings' && request.method === 'PUT') {
    const data = validateSettings(await body(request));
    await env.DB.prepare('INSERT INTO settings(id, value) VALUES(1, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value').bind(JSON.stringify(data)).run();
    return json(data);
  }
  if (path === '/api/restaurants' && request.method === 'POST') {
    const data = validate(await body(request));
    const now = new Date().toISOString();
    const row = { id: crypto.randomUUID(), ...data, scanCount: 0, createdAt: now, updatedAt: now, lastScanAt: null };
    await env.DB.prepare(`INSERT INTO restaurants (${columns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(row.id, row.name, row.slug, row.targetUrl, row.status, 0, now, now, null, row.notes).run();
    return json(row, 201);
  }
  if (path.startsWith('/api/restaurants/')) {
    const id = decodeURIComponent(path.slice('/api/restaurants/'.length));
    const existing = await env.DB.prepare('SELECT * FROM restaurants WHERE id = ?').bind(id).first<any>();
    if (!existing) fail('Restaurante no encontrado.', 404);
    if (request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM restaurants WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }
    if (request.method === 'PUT') {
      const data = validate({ ...existing, ...await body(request) });
      if (data.slug !== existing.slug) fail('El identificador es permanente: cambiarlo rompería los QR impresos.');
      const now = new Date().toISOString();
      await env.DB.prepare('UPDATE restaurants SET name = ?, targetUrl = ?, status = ?, notes = ?, updatedAt = ? WHERE id = ?').bind(data.name, data.targetUrl, data.status, data.notes, now, id).run();
      return json({ ...existing, ...data, updatedAt: now });
    }
  }
  if (path === '/api/import' && request.method === 'POST') {
    const data = await body(request);
    if (!Array.isArray(data.restaurants) || data.restaurants.length > 1000) fail('La copia debe incluir hasta 1000 restaurantes.');
    const seen = new Set<string>();
    const statements: Statement[] = [];
    for (const item of data.restaurants) {
      const row = validate(item);
      if (seen.has(row.slug)) fail('La copia tiene identificadores duplicados.');
      seen.add(row.slug);
      const count = item.scanCount ?? 0;
      if (!Number.isSafeInteger(count) || count < 0) fail('Contador inválido.');
      const date = (value: unknown) => { if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) fail('Fecha inválida.'); return new Date(value as string).toISOString(); };
      statements.push(env.DB.prepare(`INSERT INTO restaurants (${columns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(slug) DO NOTHING`).bind(crypto.randomUUID(), row.name, row.slug, row.targetUrl, row.status, count, date(item.createdAt), date(item.updatedAt), item.lastScanAt ? date(item.lastScanAt) : null, row.notes));
    }
    if (data.settings) {
      const settings = validateSettings(data.settings);
      statements.push(env.DB.prepare('INSERT INTO settings(id, value) VALUES(1, ?) ON CONFLICT(id) DO NOTHING').bind(JSON.stringify(settings)));
    }
    if (statements.length) await env.DB.batch(statements);
    return json({ ok: true, message: 'Importación completada; los identificadores existentes se han conservado.' });
  }
  return json({ error: 'Ruta no encontrada.' }, 404);
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowed = env.ALLOWED_ORIGIN;
    if (url.pathname.startsWith('/api/') && origin && origin !== url.origin && origin !== allowed) return json({ error: 'Origen no permitido.' }, 403);
    let response: Response;
    try { response = await handle(request, env); }
    catch (error) {
      if (error instanceof Response) response = error;
      else if (String(error).includes('UNIQUE constraint failed')) response = json({ error: 'Ese identificador ya existe.' }, 409);
      else { console.error('API error', error); response = json({ error: 'No se ha podido completar la operación.' }, 500); }
    }
    if (!url.pathname.startsWith('/api/')) return response;
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Vary', 'Origin');
    if (origin && (origin === url.origin || origin === allowed)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    }
    return new Response(response.body, { status: response.status, headers });
  }
};
