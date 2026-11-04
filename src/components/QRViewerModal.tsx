import React, { useState } from 'react';
import { RestaurantQR } from '../types/restaurant';
import { QRCanvas } from './QRCanvas';
import { downloadRestaurantQRPNG } from '../utils/qrExporter';
import { X, Download, Copy, Check, ExternalLink, QrCode, ArrowRight } from 'lucide-react';

interface QRViewerModalProps {
  restaurant: RestaurantQR | null;
  permanentUrl: string;
  onClose: () => void;
  onSimulateScan: (slug: string) => void;
}

export const QRViewerModal: React.FC<QRViewerModalProps> = ({
  restaurant,
  permanentUrl,
  onClose,
  onSimulateScan,
}) => {
  const [copied, setCopied] = useState(false);

  if (!restaurant) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(permanentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleDownloadPNG = () => {
    downloadRestaurantQRPNG({
      url: permanentUrl,
      restaurantName: restaurant.name,
      size: 1400,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-left">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-white truncate max-w-[240px]">
              {restaurant.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Canvas Display */}
        <div className="py-6 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl shadow-lg border-2 border-white inline-block">
            <QRCanvas
              value={permanentUrl}
              size={230}
            />
          </div>
          <span className="text-[11px] font-mono text-zinc-400 mt-3 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
            /{restaurant.slug}
          </span>
        </div>

        {/* Route info */}
        <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 text-left text-xs space-y-2 mb-5">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">
              Enlace Permanente del QR:
            </span>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className="font-mono text-zinc-300 truncate text-[11px] select-all">
                {permanentUrl}
              </span>
              <button
                onClick={handleCopy}
                className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">
              Redirige actualmente a:
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 text-emerald-400">
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono truncate text-[11px]">{restaurant.targetUrl}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={handleDownloadPNG}
            className="w-full py-2.5 px-4 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-black" />
            <span>Descargar Código QR en PNG</span>
          </button>

          <button
            onClick={() => onSimulateScan(restaurant.slug)}
            className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-zinc-700"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Simular Escaneo (Abrir destino y sumar +1)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
