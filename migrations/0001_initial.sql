CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  targetUrl TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('activo', 'pausado')),
  scanCount INTEGER NOT NULL DEFAULT 0 CHECK (scanCount >= 0),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lastScanAt TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  value TEXT NOT NULL
);
