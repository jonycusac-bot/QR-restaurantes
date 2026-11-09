export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
let adminToken = '';
export const setAdminToken = (token: string) => { adminToken = token; };
export async function api<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}), ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: 'no-store',
  });
  let result: any;
  try { result = await response.json(); } catch { throw new Error('El servidor no devuelve datos válidos. Revisa la configuración de la API.'); }
  if (!response.ok) throw new Error(result.error || 'No se ha podido conectar con el servidor.');
  return result as T;
}
