export interface RestaurantQR {
  id: string;
  name: string;
  slug: string; // Identificador permanente único para el QR, ej: "meson-el-roble"
  targetUrl: string; // URL dinámica a la que redirige actualmente
  status: 'activo' | 'pausado';
  scanCount: number; // Total de escaneos registrados
  createdAt: string;
  updatedAt: string;
  lastScanAt?: string;
  notes?: string;
}

export interface AppSettings {
  baseUrl: string; // URL base pública (ej. local o https://usuario.github.io/qr-restaurantes)
  githubUsername: string;
  githubRepo: string;
  githubBranch: string;
}
