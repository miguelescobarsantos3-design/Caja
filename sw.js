// Caja 2026 — Service Worker red primero, sin caché viejo
// Versión: fix-pc-pwa-20260523-01
const SW_VERSION = 'fix-pc-pwa-20260523-01';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  // Navegación principal: siempre red primero, sin guardar HTML viejo.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const freshReq = new Request(req.url, {
          method: 'GET',
          headers: req.headers,
          mode: req.mode,
          credentials: req.credentials,
          redirect: req.redirect,
          cache: 'no-store'
        });
        return await fetch(freshReq);
      } catch (err) {
        return new Response(
          '<!doctype html><meta charset="utf-8"><title>Sin conexión</title><body style="font-family:sans-serif;padding:24px"><h2>Sin conexión</h2><p>No se pudo cargar Caja desde la red. Revisa internet y vuelve a abrir la app.</p></body>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  // Recursos: red primero. No se cachea para evitar versiones fantasma.
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
