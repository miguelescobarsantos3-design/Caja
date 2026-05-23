// Caja 2026 — Service Worker red primero, sin caché viejo
// Versión: fix-firebase-orden-20260523-02
const SW_VERSION = 'fix-firebase-orden-20260523-02';

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

  // Recursos externos (Firebase SDK, etc.): siempre red, nunca caché.
  if (req.url.includes('gstatic.com') || req.url.includes('firebase') || req.url.includes('googleapis')) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  // Resto: red primero, caché como respaldo.
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
