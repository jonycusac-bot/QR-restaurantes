import React, { useState, useEffect } from 'react';
import { RestaurantQR } from '../types/restaurant';
import { X, Globe, Link, Sparkles, AlertCircle } from 'lucide-react';

interface RestaurantModalProps {
  restaurant: RestaurantQR | null; // null if creating
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    slug: string;
    targetUrl: string;
    status: 'activo' | 'pausado';
    notes?: string; qrTitle?: string;
  }) => void | Promise<void>;
}

export const RestaurantModal: React.FC<RestaurantModalProps> = ({
  restaurant,
  isOpen,
  onClose,
  onSave,
}) => {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [status, setStatus] = useState<'activo' | 'pausado'>('activo');
  const [notes, setNotes] = useState('');
  const [qrTitle, setQrTitle] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    setSaveError('');
    if (restaurant) {
      setName(restaurant.name);
      setSlug(restaurant.slug);
      setTargetUrl(restaurant.targetUrl);
      setStatus(restaurant.status);
      setNotes(restaurant.notes || '');
      setQrTitle(restaurant.qrTitle || '');
      setAutoSlug(false);
    } else {
      setName('');
      setSlug('');
      setTargetUrl('');
      setStatus('activo');
      setNotes('');
      setQrTitle('');
      setAutoSlug(true);
    }
  }, [restaurant, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (autoSlug && !restaurant) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !targetUrl.trim()) return;

    setSaving(true); setSaveError('');
    try { await onSave({
      name: name.trim(),
      slug: slug.trim(),
      targetUrl: targetUrl.trim(),
      status,
      notes: notes.trim() || undefined, qrTitle: qrTitle.trim(),
    });
    onClose();
    } catch (e) { setSaveError((e as Error).message); } finally { setSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">
              {restaurant ? 'Editar Restaurante y URL de Destino' : 'Dar de Alta Nuevo Restaurante'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {restaurant ? 'Modifica la URL de destino o el estado del QR' : 'Crea un nuevo QR dinámico permanente para el restaurante'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Restaurant Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1">
              Nombre del Restaurante *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Mesón El Roble"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="rounded-xl border border-amber-500/40 p-3 space-y-2">
            <label htmlFor="restaurant-qr-title" className="block text-xs font-bold text-white">Título de la franja del QR (opcional)</label>
            <input id="restaurant-qr-title" type="text" maxLength={60} value={qrTitle} onChange={e => setQrTitle(e.target.value)} placeholder="Ej. INCH | INCH SAN PEDRO" className="w-full p-2.5 text-sm font-black bg-black border border-zinc-700 rounded-lg text-white" />
            <p className="text-xs text-zinc-400">Texto independiente del restaurante. Se imprime en blanco y negrita sobre una franja negra.</p>
          </div>
          {/* Slug / Permanent identifier */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-200">
                Identificador permanente único (Slug) *
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                /?r={slug || 'codigo'}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="ej. el-roble"
                value={slug}
                disabled={!!restaurant}
                onChange={(e) => {
                  setAutoSlug(false);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
                }}
                className="w-full px-3.5 py-2.5 text-xs bg-black border border-zinc-700 rounded-lg text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Este identificador es el que queda grabado para siempre en el QR físico. No necesitarás cambiarlo nunca.
            </p>
          </div>

          {/* Dynamic Target URL */}
          <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Globe className="w-4 h-4" />
              <label className="block text-xs font-bold text-white">
                URL de Destino Dinámica (Modificable en cualquier momento) *
              </label>
            </div>
            <input
              type="url"
              required
              placeholder="https://ejemplo.com/carta-online o PDF"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-zinc-400">
              💡 Si el restaurante cambia de web, de carta en PDF o de alojamiento, cámbiala aquí y el QR impreso seguirá funcionando.
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1">
              Estado del QR
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('activo')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-2 ${
                  status === 'activo'
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 font-bold'
                    : 'border-zinc-800 bg-black text-zinc-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Activo (Redirige)</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('pausado')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-2 ${
                  status === 'pausado'
                    ? 'border-amber-500 bg-amber-950/30 text-amber-400 font-bold'
                    : 'border-zinc-800 bg-black text-zinc-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>En pausa (Aviso temporal)</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1">
              Notas internas (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Carta renovada temporada de otoño..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          {saveError && <p role="alert" className="text-red-400 text-sm">{saveError}</p>}
          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              {restaurant ? 'Guardar Cambios' : 'Crear Restaurante y QR'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
