# QR Restaurantes: preparación para Cloudflare

## Estado de producción — 9 de noviembre de 2026

Publicado con autorización del propietario en `https://qr-restaurantes.jonycusac.workers.dev/`.

- D1 `qr-restaurantes`, región WEUR, identificador `71d408d3-737b-4f34-88bc-d5ebcae5b20f`.
- Migración inicial aplicada y dirección pública configurada.
- Worker publicado: versión `f02bc983-4424-4b5e-9e71-9cbc6b53c1bb`.
- Versión anterior registrada para recuperación: `32b00dce-d48d-4246-b53b-7888b81165be`.
- `ADMIN_TOKEN` configurado como secreto. La clave está en `.wrangler/admin-key.txt`, excluida de Git. No compartir ni subir ese archivo.
- Verificación HTTP en producción correcta: acceso protegido, creación, consulta pública, incremento del contador, edición y borrado del restaurante temporal de prueba.
- TypeScript, compilación y cinco pruebas de API correctos.
- Se empieza con la base de datos vacía por decisión del propietario. No se importarán restaurantes anteriores. La importación JSON sigue disponible para futuras copias de seguridad.
- GitHub Pages se configura mediante un único workflow, `.github/workflows/deploy.yml`, con la API de Cloudflare en `VITE_API_BASE_URL`. Cada push a `main` comprueba TypeScript, prueba la API y publica el frontend.

`.env.local` activa `/api` para las próximas compilaciones locales. La base local de Wrangler se inicializa por separado con `npm run db:local`.

Las secciones siguientes describen el funcionamiento y el procedimiento de configuración para referencia.

## Qué se ha preparado

- Worker que sirve el frontend y una API, con una base de datos D1.
- Restaurantes, destinos, estado, contadores y configuración compartidos.
- Consulta pública sin acceso a notas internas; administración protegida mediante una clave secreta de al menos 32 caracteres.
- La clave se introduce en el panel y se mantiene solo en memoria. Al recargar se vuelve a pedir. Nunca debe ponerse en una variable `VITE_` ni en GitHub.
- El identificador del restaurante no se puede modificar al editar. Se cambia el destino conservando el enlace impreso.
- Importación de copias JSON del formato anterior. Añade restaurantes nuevos y conserva los existentes con el mismo identificador; no sobrescribe destinos ni contadores. Se valida toda la copia antes de guardar y se ejecuta en una transacción.
- Los escaneos se incrementan en el servidor de forma atómica para códigos activos. Son visitas registradas, no personas únicas; la simulación también cuenta. La ruta pública de estadísticas puede recibir solicitudes automatizadas.

## Conservar los datos actuales

Los datos antiguos están en el navegador y origen donde se crearon, no en la carpeta ni en GitHub. Antes de cambiar el alojamiento, abrir la versión anterior en ese mismo navegador y exportar la copia JSON desde el panel. Mantener esa copia. En el panel conectado a Cloudflare se puede importar el archivo.

## Pruebas locales (sin publicar)

Requiere Node.js 24 para las pruebas de API con SQLite incorporado.

```powershell
npm install --legacy-peer-deps
npm run lint
npm run test:api
Copy-Item .env.cloudflare.example .env.local
Copy-Item .dev.vars.example .dev.vars
npm run build
npm run db:local
npm run cf:dev
```

Abrir la dirección que indique Wrangler e introducir la clave local de `.dev.vars`. No usar esa clave de ejemplo en producción. Wrangler utiliza una base SQLite local en `.wrangler/`; estos comandos no crean recursos remotos. `database_id` contiene el identificador de la base D1 de producción; el modo `--local` no modifica esa base remota.

Sin `VITE_API_BASE_URL`, la aplicación conserva el funcionamiento local anterior. Con `/api` consulta el Worker del mismo dominio. Para desarrollo con Vite separado del Worker, usar la dirección absoluta de la API y configurar `ALLOWED_ORIGIN` para el origen local del frontend.

## Procedimiento de publicación (primera publicación completada)

Antes de publicar hay que confirmar la URL y el proyecto actual en Cloudflare. La configuración incluida corresponde a Workers con recursos estáticos. Si el alojamiento existente es Cloudflare Pages, se debe adaptar su despliegue o acordar la migración a Workers antes de subir cambios.

Después de la autorización:

1. Crear D1 `qr-restaurantes` y sustituir el marcador `database_id` en `wrangler.jsonc` por su identificador real.
2. Aplicar `migrations/0001_initial.sql` en la base remota.
3. Configurar `ADMIN_TOKEN` como secreto del Worker con una clave aleatoria de al menos 32 caracteres.
4. Compilar con `VITE_API_BASE_URL=/api` y publicar frontend y Worker juntos.
5. Entrar, configurar la dirección pública e importar la copia JSON.
6. Comprobar un QR real desde un móvil sin sesión y verificar edición, pausa y persistencia.

La configuración de producción usa `https://qr-restaurantes.jonycusac.workers.dev` para los nuevos QR. Los enlaces anteriores de GitHub Pages requieren el cambio separado indicado abajo.

## Conservar QR ya impresos con GitHub Pages

Publicar únicamente una nueva web en Cloudflare no actualiza los QR impresos que apuntan a `https://jonycusac-bot.github.io/QR-restaurantes/?r=...`.

Para que sigan funcionando se debe actualizar también el frontend de GitHub Pages, compilándolo con `VITE_API_BASE_URL=https://qr-restaurantes.jonycusac.workers.dev/api`. El Worker ya admite `ALLOWED_ORIGIN=https://jonycusac-bot.github.io`. No incluir la ruta del repositorio en este origen. El propietario autorizó esta actualización de GitHub Pages el 9 de noviembre de 2026.

Se ha eliminado el workflow duplicado `blank.yml`. El workflow `deploy.yml` usa Node.js 24, instala desde `package-lock.json` y compila con la dirección absoluta de la API de Cloudflare.

## Límites de esta primera versión

La administración tiene una única clave compartida; no incluye cuentas independientes para cada restaurante. Las cartas y PDFs siguen alojados en sus direcciones actuales; D1 guarda sus enlaces, no los archivos. El panel se actualiza al iniciar sesión, recuperar el foco o pulsar Actualizar. No hay sincronización en tiempo real mientras permanece abierto. La importación admite hasta 1000 restaurantes y 1 MB de JSON.
