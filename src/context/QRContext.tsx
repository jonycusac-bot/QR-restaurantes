import React, { createContext, useContext, useEffect, useState } from 'react';
import { RestaurantQR, AppSettings } from '../types/restaurant';
import { INITIAL_RESTAURANTS, INITIAL_SETTINGS } from '../data/initialData';

interface QRContextType {
  restaurants: RestaurantQR[];
  settings: AppSettings;
  addRestaurant: (data: { name: string; slug: string; targetUrl: string; notes?: string; status?: 'activo' | 'pausado' }) => RestaurantQR;
  updateRestaurant: (id: string, updates: Partial<RestaurantQR>) => void;
  deleteRestaurant: (id: string) => void;
  recordScan: (slug: string) => RestaurantQR | null;
  getPermanentQRUrl: (slug: string) => string;
  updateSettings: (updates: Partial<AppSettings>) => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonStr: string) => boolean;
  resetToDemoData: () => void;
}

const STORAGE_KEY = 'qr_restaurantes_v2';

const QRContext = createContext<QRContextType | undefined>(undefined);

export const QRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<RestaurantQR[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_restaurants`);
      return saved ? JSON.parse(saved) : INITIAL_RESTAURANTS;
    } catch {
      return INITIAL_RESTAURANTS;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          baseUrl: parsed.baseUrl?.trim() ? parsed.baseUrl : INITIAL_SETTINGS.baseUrl,
          githubUsername: parsed.githubUsername || INITIAL_SETTINGS.githubUsername,
          githubRepo: parsed.githubRepo || INITIAL_SETTINGS.githubRepo,
        };
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_restaurants`, JSON.stringify(restaurants));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
  }, [restaurants, settings]);

  const addRestaurant = (data: {
    name: string;
    slug: string;
    targetUrl: string;
    notes?: string;
    status?: 'activo' | 'pausado';
  }): RestaurantQR => {
    // Sanitize slug
    let cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    if (!cleanSlug) {
      cleanSlug = data.name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    }

    // Ensure uniqueness
    let finalSlug = cleanSlug;
    let counter = 1;
    while (restaurants.some(r => r.slug.toLowerCase() === finalSlug.toLowerCase())) {
      finalSlug = `${cleanSlug}-${counter}`;
      counter++;
    }

    // Ensure valid targetUrl
    let url = data.targetUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const newRest: RestaurantQR = {
      id: `rest_${Date.now()}`,
      name: data.name.trim(),
      slug: finalSlug,
      targetUrl: url,
      status: data.status || 'activo',
      scanCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: data.notes?.trim() || undefined,
    };

    setRestaurants(prev => [newRest, ...prev]);
    return newRest;
  };

  const updateRestaurant = (id: string, updates: Partial<RestaurantQR>) => {
    setRestaurants(prev =>
      prev.map(r => {
        if (r.id !== id) return r;

        let cleanUrl = updates.targetUrl !== undefined ? updates.targetUrl.trim() : r.targetUrl;
        if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = `https://${cleanUrl}`;
        }

        let cleanSlug = updates.slug !== undefined ? updates.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : r.slug;

        return {
          ...r,
          ...updates,
          targetUrl: cleanUrl,
          slug: cleanSlug,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteRestaurant = (id: string) => {
    setRestaurants(prev => prev.filter(r => r.id !== id));
  };

  const recordScan = (slug: string): RestaurantQR | null => {
    let found: RestaurantQR | null = null;
    setRestaurants(prev =>
      prev.map(r => {
        if (r.slug.toLowerCase() === slug.toLowerCase()) {
          const updated: RestaurantQR = {
            ...r,
            scanCount: r.scanCount + 1,
            lastScanAt: new Date().toISOString(),
          };
          found = updated;
          return updated;
        }
        return r;
      })
    );
    return found;
  };

  const getPermanentQRUrl = (slug: string): string => {
    if (settings.baseUrl && settings.baseUrl.trim() !== '') {
      const base = settings.baseUrl.replace(/\/$/, '');
      return `${base}/?r=${encodeURIComponent(slug)}`;
    }
    if (typeof window !== 'undefined') {
      const base = `${window.location.origin}${window.location.pathname}`.replace(/\/$/, '');
      return `${base}/?r=${encodeURIComponent(slug)}`;
    }
    return `https://tudominio.com/?r=${encodeURIComponent(slug)}`;
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const exportDataJSON = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      version: '2.0',
      settings,
      restaurants,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_Restaurantes_Copia_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.restaurants)) {
        setRestaurants(data.restaurants);
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      return true;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  };

  const resetToDemoData = () => {
    setRestaurants(INITIAL_RESTAURANTS);
    setSettings(INITIAL_SETTINGS);
  };

  return (
    <QRContext.Provider
      value={{
        restaurants,
        settings,
        addRestaurant,
        updateRestaurant,
        deleteRestaurant,
        recordScan,
        getPermanentQRUrl,
        updateSettings,
        exportDataJSON,
        importDataJSON,
        resetToDemoData,
      }}
    >
      {children}
    </QRContext.Provider>
  );
};

export const useQR = () => {
  const ctx = useContext(QRContext);
  if (!ctx) throw new Error('useQR must be used within QRProvider');
  return ctx;
};
