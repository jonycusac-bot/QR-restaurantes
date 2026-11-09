import React, { useEffect, useState } from 'react';
import { QRContext } from './QRContext';
import { RestaurantQR, AppSettings } from '../types/restaurant';
import { INITIAL_SETTINGS } from '../data/initialData';
import { api, setAdminToken } from '../utils/api';

export function CloudQRProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<RestaurantQR[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [authenticated, setAuthenticated] = useState(false);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [localBackup] = useState(() => {
    try {
      const saved = localStorage.getItem('qr_restaurantes_v2_restaurants');
      if (!saved) return null;
      const rows = JSON.parse(saved);
      if (!Array.isArray(rows) || !rows.length) return null;
      const config = localStorage.getItem('qr_restaurantes_v2_settings');
      return JSON.stringify({ version: '2.0', exportDate: new Date().toISOString(), restaurants: rows, settings: config ? JSON.parse(config) : undefined }, null, 2);
    } catch { return null; }
  });
  const downloadLocalBackup = () => {
    if (!localBackup) return;
    const url = URL.createObjectURL(new Blob([localBackup], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'QR_Restaurantes_Datos_Anteriores.json'; a.click(); URL.revokeObjectURL(url);
  };
  const publicView = !!new URLSearchParams(window.location.search).get('r');
  const load = async () => {
    const [rows, config] = await Promise.all([api<RestaurantQR[]>('/restaurants'), api<AppSettings | null>('/settings')]);
    setRestaurants(rows);
    setSettings(config || INITIAL_SETTINGS);
  };
  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setAdminToken(key.trim());
    try { await load(); setAuthenticated(true); setKey(''); }
    catch (e) { setAdminToken(''); setError((e as Error).message); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!authenticated) return;
    const refresh = () => { load().catch(e => setError(e.message)); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [authenticated]);
  const exportDataJSON = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: '3.0', exportDate: new Date().toISOString(), restaurants, settings }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `QR_Restaurantes_Copia_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
  };
  if (!authenticated && !publicView) return <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
    <form onSubmit={login} className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full space-y-4">
      <h1 className="text-xl font-bold">Administración de QR</h1>
      <p className="text-sm text-zinc-400">Introduce tu clave de administración para acceder a los datos compartidos.</p>
      {localBackup && <div className="rounded bg-amber-950 p-3 text-sm text-amber-200"><p>Hay restaurantes guardados en este navegador. Descarga una copia y, tras entrar, impórtala desde Copias de seguridad.</p><button type="button" className="underline mt-2" onClick={downloadLocalBackup}>Descargar datos anteriores</button></div>}
      <label className="block text-sm">Clave de administración<input autoComplete="current-password" type="password" required value={key} onChange={e => setKey(e.target.value)} className="block w-full mt-2 p-3 bg-black rounded border border-zinc-700" /></label>
      {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
      <button disabled={busy} className="w-full bg-white text-black p-3 rounded font-bold disabled:opacity-50">{busy ? 'Conectando…' : 'Entrar'}</button>
    </form>
  </main>;
  return <QRContext.Provider value={{ restaurants, settings,
    addRestaurant: async data => { const row = await api<RestaurantQR>('/restaurants', 'POST', { ...data, status: data.status || 'activo' }); setRestaurants(prev => [row, ...prev]); return row; },
    updateRestaurant: async (id, updates) => { const row = await api<RestaurantQR>(`/restaurants/${encodeURIComponent(id)}`, 'PUT', updates); setRestaurants(prev => prev.map(r => r.id === id ? row : r)); },
    deleteRestaurant: async id => { await api(`/restaurants/${encodeURIComponent(id)}`, 'DELETE'); setRestaurants(prev => prev.filter(r => r.id !== id)); },
    recordScan: () => null,
    getPermanentQRUrl: slug => `${settings.baseUrl.replace(/\/$/, '')}/?r=${encodeURIComponent(slug)}`,
    updateSettings: async updates => { const result = await api<AppSettings>('/settings', 'PUT', { ...settings, ...updates }); setSettings(result); },
    exportDataJSON,
    importDataJSON: async value => { try { await api('/import', 'POST', JSON.parse(value)); await load(); return true; } catch (e) { setError((e as Error).message); return false; } },
    resetToDemoData: () => { setError('La restauración de datos de ejemplo está desactivada para proteger la base de datos compartida.'); },
  }}>
    {authenticated && !publicView && <div className="bg-zinc-900 text-zinc-300 px-4 py-2 text-xs flex gap-4 items-center"><span>Datos compartidos · Cloudflare</span><button onClick={() => { setAdminToken(''); setAuthenticated(false); setRestaurants([]); }}>Cerrar sesión</button><button onClick={() => load().then(() => setError('')).catch(e => setError(e.message))}>Actualizar</button></div>}
    {authenticated && !publicView && localBackup && <div className="bg-amber-950 text-amber-200 p-3 text-sm">Hay datos de la versión anterior en este navegador. <button className="underline" onClick={downloadLocalBackup}>Descargar copia para importar</button></div>}
    {error && <div role="alert" className="bg-red-950 text-red-200 p-3">{error}<button className="ml-4" onClick={() => setError('')}>Cerrar</button></div>}
    {children}
  </QRContext.Provider>;
}
