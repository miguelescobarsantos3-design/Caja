/* Caja de Ahorro 2026 — Service Worker RED PRIMERO
   Versión: 20260429-network-first-v3
   Regla: no usar cache-first; pedir siempre la red para evitar apps viejas en celular. */
const SW_VERSION = '20260429-network-first-v3';

async function borrarCachesViejos() {
  if (!self.caches || !caches.keys) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(borrarCachesViejos());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await borrarCachesViejos();
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((client) => client.postMessage({ type: 'SW_ACTIVATED', version: SW_VERSION }));
  })());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'CLEAR_OLD_CACHES') event.waitUntil(borrarCachesViejos());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (!request || request.method !== 'GET') return;

  event.respondWith((async () => {
    try {
      const url = new URL(request.url);

      // Navegación y archivos del mismo sitio: siempre red, sin guardar cache.
      if (url.origin === self.location.origin) {
        return await fetch(request, { cache: 'no-store' });
      }

      // CDNs externos: red normal. Si el navegador cachea fuentes/librerías, no afecta al index.
      return await fetch(request);
    } catch (err) {
      if (request.mode === 'navigate') {
        return new Response(
          '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión</title></head><body style="font-family:Arial,sans-serif;padding:24px"><h2>Sin conexión</h2><p>La app está configurada para cargar primero desde internet. Conéctate y vuelve a abrirla.</p></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
        );
      }
      throw err;
    }
  })());
});
