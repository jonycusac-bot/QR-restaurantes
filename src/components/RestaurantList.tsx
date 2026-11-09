import React, { useState } from 'react';
import { RestaurantQR } from '../types/restaurant';
import { QRCanvas } from './QRCanvas';
import { downloadRestaurantQRPNG } from '../utils/qrExporter';
import { 
  Search, 
  Download, 
  ExternalLink, 
  Edit2, 
  Trash2, 
  Eye, 
  QrCode, 
  Globe, 
  Check, 
  Copy, 
  Sparkles,
  Clock,
  Plus
} from 'lucide-react';

interface RestaurantListProps {
  restaurants: RestaurantQR[];
  onOpenCreate: () => void;
  onEdit: (restaurant: RestaurantQR) => void;
  onDelete: (id: string) => void;
  onViewQR: (restaurant: RestaurantQR) => void;
  getPermanentQRUrl: (slug: string) => string;
}

export const RestaurantList: React.FC<RestaurantListProps> = ({
  restaurants,
  onOpenCreate,
  onEdit,
  onDelete,
  onViewQR,
  getPermanentQRUrl,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'pausado'>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Filter restaurants
  const filtered = restaurants.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q) || r.targetUrl.toLowerCase().includes(q);
    }
    return true;
  });

  const totalScans = restaurants.reduce((acc, r) => acc + r.scanCount, 0);
  const activeCount = restaurants.filter(r => r.status === 'activo').length;

  const handleCopyLink = async (slug: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Sin escaneos';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [selectedScanRestId, setSelectedScanRestId] = useState<string>('all');

  const selectedScanRestaurant = selectedScanRestId === 'all'
    ? null
    : restaurants.find(r => r.id === selectedScanRestId);

  const displayedScans = selectedScanRestaurant
    ? selectedScanRestaurant.scanCount
    : totalScans;

  const scanPercentage = (selectedScanRestaurant && totalScans > 0)
    ? Math.round((selectedScanRestaurant.scanCount / totalScans) * 100)
    : null;

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Restaurantes */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white flex flex-col justify-between">
          <div>
            <span className="text-zinc-400 text-xs font-medium">Total Restaurantes</span>
            <div className="text-2xl font-bold mt-1 tabular-nums">{restaurants.length}</div>
          </div>
          <span className="text-[11px] text-zinc-500 mt-2 block">{activeCount} activos redirigiendo</span>
        </div>

        {/* Card 2: Escaneos con Selector Individual de Restaurante */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400 text-xs font-medium">
                {selectedScanRestaurant ? 'Escaneos del Restaurante' : 'Escaneos Totales'}
              </span>
              {/* Dropdown selector */}
              <select
                value={selectedScanRestId}
                onChange={(e) => setSelectedScanRestId(e.target.value)}
                className="text-[11px] bg-black text-white border border-zinc-700 rounded-md px-2 py-1 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">📊 Todos (Total Global)</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.scanCount})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-amber-400 tabular-nums">
                {displayedScans}
              </span>
              {scanPercentage !== null && (
                <span className="text-xs text-zinc-400 font-medium">
                  ({scanPercentage}% del total)
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
            {selectedScanRestaurant ? (
              <>
                <span className="truncate max-w-[180px]">
                  {selectedScanRestaurant.name}
                </span>
                <span className="text-zinc-500 shrink-0">
                  {formatDate(selectedScanRestaurant.lastScanAt)}
                </span>
              </>
            ) : (
              <span>Suma acumulada de todos los restaurantes</span>
            )}
          </div>
        </div>

        {/* Card 3: Acción Rápida */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white flex flex-col justify-between">
          <div>
            <span className="text-zinc-400 text-xs font-medium">Acción Rápida</span>
            <p className="text-xs text-zinc-300 mt-1">Crea un nuevo código para un restaurante</p>
          </div>
          <button
            onClick={onOpenCreate}
            className="mt-2 py-1.5 px-3 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nuevo Restaurante</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar restaurante por nombre o código slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* State filters */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({restaurants.length})
          </button>
          <button
            onClick={() => setStatusFilter('activo')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'activo'
                ? 'bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-800/80'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Activos ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('pausado')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'pausado'
                ? 'bg-amber-950/60 text-amber-400 font-bold border border-amber-800/80'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pausados ({restaurants.length - activeCount})
          </button>
        </div>
      </div>

      {/* Restaurants List / Cards */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-white">
          <QrCode className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-200">
            No se encontraron restaurantes
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {search ? 'Prueba con otro término de búsqueda o limpia los filtros.' : 'Comienza dando de alta tu primer restaurante.'}
          </p>
          <button
            onClick={onOpenCreate}
            className="mt-4 px-4 py-2 bg-white text-black font-bold text-xs rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Dar de alta Restaurante
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(restaurant => {
            const permanentUrl = getPermanentQRUrl(restaurant.slug);

            return (
              <div
                key={restaurant.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-white flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-xs"
              >
                <div>
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-800">
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">
                        {restaurant.name}
                      </h3>
                      <span className="font-mono text-[11px] text-zinc-400 block mt-0.5">
                        /?r={restaurant.slug}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                        restaurant.status === 'activo'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {restaurant.status}
                    </span>
                  </div>

                  {/* QR Preview & Route details */}
                  <div className="py-4 flex items-center gap-4">
                    {/* Small QR Thumbnail */}
                    <div 
                      onClick={() => onViewQR(restaurant)}
                      className="cursor-pointer shrink-0 p-1 bg-white rounded-lg shadow-sm hover:scale-105 transition-transform"
                      title="Haz clic para ver en grande"
                    >
                      <QRCanvas value={permanentUrl} size={80} title={restaurant.qrTitle} />
                    </div>

                    {/* Stats & Url */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Scan Counter */}
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-white tabular-nums">
                          {restaurant.scanCount}
                        </span>
                        <span className="text-xs text-zinc-400">escaneos</span>
                      </div>

                      <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>Último: {formatDate(restaurant.lastScanAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Current Target URL container */}
                  <div className="p-2.5 bg-black/60 rounded-xl border border-zinc-800/80 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                      URL de Destino Dinámica:
                    </span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-emerald-400 text-[11px] truncate" title={restaurant.targetUrl}>
                        {restaurant.targetUrl}
                      </span>
                      <a
                        href={restaurant.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-white p-1"
                        title="Abrir destino en pestaña nueva"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {restaurant.notes && (
                    <p className="text-[11px] text-zinc-400 mt-2 italic line-clamp-1">
                      Nota: {restaurant.notes}
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        downloadRestaurantQRPNG({
                          url: permanentUrl,
                          restaurantName: restaurant.name, title: restaurant.qrTitle,
                          size: 1400,
                        })
                      }
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors shadow-2xs"
                      title="Descargar código QR en formato PNG"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar PNG</span>
                    </button>

                    <button
                      onClick={() => onViewQR(restaurant)}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors border border-zinc-700"
                    >
                      QR y título
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyLink(restaurant.slug, permanentUrl)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded"
                      title="Copiar enlace del QR"
                    >
                      {copiedSlug === restaurant.slug ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => onEdit(restaurant)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded"
                      title="Editar restaurante y cambiar URL"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el restaurante "${restaurant.name}"?`)) {
                          onDelete(restaurant.id);
                        }
                      }}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 rounded"
                      title="Eliminar restaurante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
