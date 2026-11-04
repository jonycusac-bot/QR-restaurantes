import React, { useEffect, useState } from 'react';
import { QRProvider, useQR } from './context/QRContext';
import { Header, ActiveView } from './components/Header';
import { RestaurantList } from './components/RestaurantList';
import { RestaurantModal } from './components/RestaurantModal';
import { QRViewerModal } from './components/QRViewerModal';
import { GitHubPublishView } from './components/GitHubPublishView';
import { RedirectScreen } from './components/RedirectScreen';
import { RestaurantQR } from './types/restaurant';

const MainDashboard: React.FC = () => {
  const { 
    restaurants, 
    addRestaurant, 
    updateRestaurant, 
    deleteRestaurant, 
    getPermanentQRUrl 
  } = useQR();

  const [activeView, setActiveView] = useState<ActiveView>('restaurants');
  const [scanSlug, setScanSlug] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantQR | null>(null);
  const [viewingQRRestaurant, setViewingQRRestaurant] = useState<RestaurantQR | null>(null);

  // Detect QR scan via URL query parameter on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const slugParam = params.get('r');
    if (slugParam) {
      setScanSlug(slugParam);
    }
  }, []);

  const handleOpenCreate = () => {
    setEditingRestaurant(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (restaurant: RestaurantQR) => {
    setEditingRestaurant(restaurant);
    setIsModalOpen(true);
  };

  const handleSaveRestaurant = (data: {
    name: string;
    slug: string;
    targetUrl: string;
    status: 'activo' | 'pausado';
    notes?: string;
  }) => {
    if (editingRestaurant) {
      updateRestaurant(editingRestaurant.id, data);
    } else {
      addRestaurant(data);
    }
  };

  const handleSimulateScan = (slug: string) => {
    setViewingQRRestaurant(null);
    setScanSlug(slug);
  };

  // If someone scanned a dynamic QR code
  if (scanSlug) {
    return (
      <RedirectScreen
        slug={scanSlug}
        onGoToAdmin={() => {
          setScanSlug(null);
          // Clean URL without reloading
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('r');
            window.history.replaceState({}, '', url.pathname);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Dark Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenNewRestaurant={handleOpenCreate}
        totalRestaurants={restaurants.length}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'restaurants' && (
          <RestaurantList
            restaurants={restaurants}
            onOpenCreate={handleOpenCreate}
            onEdit={handleOpenEdit}
            onDelete={deleteRestaurant}
            onViewQR={(r) => setViewingQRRestaurant(r)}
            getPermanentQRUrl={getPermanentQRUrl}
          />
        )}

        {(activeView === 'github' || activeView === 'backup') && (
          <GitHubPublishView />
        )}
      </main>

      {/* Minimalist Dark Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 px-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            QR Restaurantes · Panel de Códigos QR Dinámicos
          </span>
          <span className="text-zinc-400 font-mono text-[11px]">
            C:\Users\Usuario\Desktop\QR Restaurantes
          </span>
        </div>
      </footer>

      {/* Modal: Create or Edit Restaurant */}
      <RestaurantModal
        isOpen={isModalOpen}
        restaurant={editingRestaurant}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRestaurant}
      />

      {/* Modal: QR Viewer & PNG Downloader */}
      <QRViewerModal
        restaurant={viewingQRRestaurant}
        permanentUrl={viewingQRRestaurant ? getPermanentQRUrl(viewingQRRestaurant.slug) : ''}
        onClose={() => setViewingQRRestaurant(null)}
        onSimulateScan={handleSimulateScan}
      />

    </div>
  );
};

export default function App() {
  return (
    <QRProvider>
      <MainDashboard />
    </QRProvider>
  );
}
