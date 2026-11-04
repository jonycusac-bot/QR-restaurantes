import React from 'react';
import { QrCode, Plus, FolderGit2, Database, Search } from 'lucide-react';

export type ActiveView = 'restaurants' | 'github' | 'backup';

interface HeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenNewRestaurant: () => void;
  totalRestaurants: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onOpenNewRestaurant,
  totalRestaurants,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <QrCode className="w-5 h-5 text-amber-500" />
            </div>
            <button
              onClick={() => setActiveView('restaurants')}
              className="text-left group"
            >
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors whitespace-nowrap">
                QR Restaurantes
              </h1>
              <p className="text-[10px] text-zinc-400 -mt-0.5 whitespace-nowrap">
                Gestión de Códigos Dinámicos
              </p>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveView('restaurants')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeView === 'restaurants'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Restaurantes ({totalRestaurants})</span>
            </button>

            <button
              onClick={() => setActiveView('github')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeView === 'github'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Publicar en GitHub</span>
            </button>

            <button
              onClick={() => setActiveView('backup')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeView === 'backup'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Copia de Seguridad</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenNewRestaurant}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>Dar de alta Restaurante</span>
            </button>
          </div>

        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-2 py-2 border-t border-zinc-900 text-xs">
          <button
            onClick={() => setActiveView('restaurants')}
            className={`px-3 py-1.5 rounded-md ${activeView === 'restaurants' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
          >
            Restaurantes ({totalRestaurants})
          </button>
          <button
            onClick={() => setActiveView('github')}
            className={`px-3 py-1.5 rounded-md ${activeView === 'github' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
          >
            Publicar en GitHub
          </button>
          <button
            onClick={() => setActiveView('backup')}
            className={`px-3 py-1.5 rounded-md ${activeView === 'backup' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
          >
            Copia de Seguridad
          </button>
        </div>

      </div>
    </header>
  );
};
