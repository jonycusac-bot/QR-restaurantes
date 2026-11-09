import { PublicRedirect } from './PublicRedirect';
import React, { useEffect, useState } from 'react';
import { useQR } from '../context/QRContext';
import { RestaurantQR } from '../types/restaurant';
import { QrCode, ArrowRight, ExternalLink, AlertTriangle } from 'lucide-react';

interface RedirectScreenProps {
  slug: string;
  onGoToAdmin: () => void;
}

const LocalRedirectScreen: React.FC<RedirectScreenProps> = ({ slug, onGoToAdmin }) => {
  const { restaurants, recordScan } = useQR();
  const [restaurant, setRestaurant] = useState<RestaurantQR | null>(null);
  const [countdown, setCountdown] = useState<number>(2);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    const found = restaurants.find(r => r.slug.toLowerCase() === slug.toLowerCase());
    if (found) {
      setRestaurant(found);
      if (!hasScanned) {
        recordScan(slug);
        setHasScanned(true);
      }
    }
  }, [slug, restaurants, recordScan, hasScanned]);

  // Countdown and redirect
  useEffect(() => {
    if (!restaurant || restaurant.status !== 'activo') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(c => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      window.location.href = restaurant.targetUrl;
    }
  }, [countdown, restaurant]);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl space-y-4">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">
            Restaurante no encontrado
          </h2>
          <p className="text-xs text-zinc-400">
            No existe ningún restaurante registrado con el código <code className="text-amber-400 font-mono">/{slug}</code>.
          </p>
          <button
            onClick={onGoToAdmin}
            className="mt-4 px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200"
          >
            Ir al Panel de Gestión
          </button>
        </div>
      </div>
    );
  }

  if (restaurant.status === 'pausado') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl space-y-4">
          <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-center justify-center mx-auto text-amber-400">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {restaurant.name}
          </h2>
          <p className="text-xs text-amber-400 font-medium">
            El código QR de este restaurante se encuentra temporalmente en pausa.
          </p>
          {restaurant.notes && (
            <p className="text-xs text-zinc-400 italic">
              "{restaurant.notes}"
            </p>
          )}
          <div className="pt-2">
            <button
              onClick={onGoToAdmin}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-700"
            >
              Volver al Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl space-y-5 animate-in fade-in duration-200">
        
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <QrCode className="w-8 h-8 text-black animate-pulse" />
        </div>

        <div>
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            Código QR Dinámico
          </span>
          <h2 className="text-2xl font-bold text-white mt-0.5">
            {restaurant.name}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Redirigiendo automáticamente a la carta online...
          </p>
        </div>

        {/* Target URL container */}
        <div className="p-3 bg-black rounded-xl border border-zinc-800 text-xs font-mono text-emerald-400 truncate">
          {restaurant.targetUrl}
        </div>

        <p className="text-xs text-zinc-400">
          Entrando en <span className="text-white font-bold tabular-nums">{countdown}s</span>...
        </p>

        <div className="pt-2 flex flex-col gap-2">
          <a
            href={restaurant.targetUrl}
            className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Acceder ahora</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </a>

          <button
            onClick={onGoToAdmin}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 pt-2"
          >
            Panel de administración
          </button>
        </div>

      </div>
    </div>
  );
};

export const RedirectScreen: React.FC<RedirectScreenProps> = props => import.meta.env.VITE_API_BASE_URL ? <PublicRedirect slug={props.slug} /> : <LocalRedirectScreen {...props} />;
