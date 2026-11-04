import { RestaurantQR, AppSettings } from '../types/restaurant';

export const INITIAL_RESTAURANTS: RestaurantQR[] = [
  {
    id: 'rest_1',
    name: 'Mesón El Roble',
    slug: 'el-roble',
    targetUrl: 'https://ejemplo.com/carta-meson-el-roble',
    status: 'activo',
    scanCount: 142,
    createdAt: '2026-10-15T12:00:00Z',
    updatedAt: '2026-11-02T18:30:00Z',
    lastScanAt: '2026-11-04T08:15:00Z',
    notes: 'Carta de tapas y asados de leña',
  },
  {
    id: 'rest_2',
    name: 'Pizzería Bella Napoli',
    slug: 'bella-napoli',
    targetUrl: 'https://ejemplo.com/carta-pizzeria-napoli.pdf',
    status: 'activo',
    scanCount: 89,
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-11-01T14:20:00Z',
    lastScanAt: '2026-11-03T21:40:00Z',
    notes: 'Carta de pizzas al horno de leña en PDF',
  },
  {
    id: 'rest_3',
    name: 'Bar La Esquina',
    slug: 'la-esquina',
    targetUrl: 'https://ejemplo.com/menu-del-dia',
    status: 'pausado',
    scanCount: 34,
    createdAt: '2026-10-28T16:00:00Z',
    updatedAt: '2026-11-03T11:00:00Z',
    lastScanAt: '2026-11-03T17:22:00Z',
    notes: 'Cerrado temporalmente por reformas',
  },
];

export const INITIAL_SETTINGS: AppSettings = {
  baseUrl: 'https://jonycusac-bot.github.io/QR-restaurantes',
  githubUsername: 'jonycusac-bot',
  githubRepo: 'QR-restaurantes',
  githubBranch: 'main',
};
