// Caja 2026 — Service Worker red primero, sin caché
// Versión: 20260525-01
const SW_VERSION = '20260525-01';

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

  // Navegación principal: siempre red, nunca caché
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(new Request(req.url, {
          method: 'GET',
          headers: req.headers,
          mode: req.mode,
          credentials: req.credentials,
          redirect: req.redirect,
          cache: 'no-store'
        }));
      } catch (err) {
        return new Response(
          '<!doctype html><meta charset="utf-8"><title>Sin conexión</title><body style="font-family:sans-serif;padding:24px"><h2>Sin conexión</h2><p>Revisa tu internet y vuelve a abrir la app.</p></body>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  // Firebase y recursos externos: siempre red, nunca caché
  if (
    req.url.includes('gstatic.com') ||
    req.url.includes('firebase') ||
    req.url.includes('googleapis') ||
    req.url.includes('firestore')
  ) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  // Todo lo demás: red primero, caché solo si falla la red
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
