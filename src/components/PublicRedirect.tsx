import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
type PublicRestaurant = { name: string; slug: string; status: 'activo' | 'pausado'; targetUrl?: string };
export function PublicRedirect({ slug }: { slug: string }) {
  const [restaurant, setRestaurant] = useState<PublicRestaurant | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setRestaurant(null); setError('');
    api<PublicRestaurant>(`/resolve/${encodeURIComponent(slug)}`).then(row => {
      if (cancelled) return;
      setRestaurant(row);
      if (row.status === 'activo' && row.targetUrl) {
        // Count once per resolved visit. Failed analytics never block the menu.
        void api(`/scan/${encodeURIComponent(slug)}`, 'POST').catch(() => {});
        timer = setTimeout(() => { window.location.replace(row.targetUrl!); }, 1200);
      }
    }).catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [slug, attempt]);
  return <main className="min-h-screen bg-black text-white flex justify-center items-center p-6 text-center">
    <div className="bg-zinc-900 p-8 rounded-2xl max-w-md space-y-4">
      <h1 className="text-xl font-bold">{restaurant?.name || 'Carta del restaurante'}</h1>
      {error ? <><p role="alert" className="text-amber-400">{error}</p><button onClick={() => setAttempt(a => a + 1)}>Reintentar</button></> : !restaurant ? <p role="status">Consultando el código QR…</p> : restaurant.status === 'pausado' ? <p>Este código QR está temporalmente en pausa.</p> : <><p>Abriendo la carta…</p><a className="block rounded bg-white text-black p-3" href={restaurant.targetUrl}>Acceder ahora</a></>}
    </div>
  </main>;
}
