# QR Restaurantes

Panel de códigos QR dinámicos con React y Vite. Permite cambiar el destino de la carta manteniendo el mismo enlace QR.

## Modo local

Con Node.js 24, ejecutar `npm install --legacy-peer-deps` y `npm run dev`.
Sin `VITE_API_BASE_URL`, los datos se guardan únicamente en el navegador actual.
No se necesita una clave de Gemini para estas funciones.

## Datos compartidos en Cloudflare

La preparación incluye una API en Workers, migraciones D1, acceso administrativo con clave e importación de las copias JSON anteriores. Consultar [CLOUDFLARE.md](CLOUDFLARE.md) para pruebas locales, migración y conservación de los QR impresos.

Producción: https://qr-restaurantes.jonycusac.workers.dev/. GitHub Pages usa la misma API de Cloudflare mediante el workflow único `.github/workflows/deploy.yml`. Se empieza con la base vacía, sin importar restaurantes anteriores.

## Verificación

- `npm run lint`: comprobación de TypeScript.
- `npm run test:api`: pruebas de API con SQLite en memoria, sin recursos remotos.
- `npm run build`: compilación del frontend.
- `node tests/local-worker.mjs`: prueba HTTP contra el Worker local en el puerto 8787; requiere `.dev.vars`, migraciones locales y Worker arrancado.
