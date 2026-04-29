// Caja 2026 - Service Worker sin caché (red primero)
// Actualización: 20260429-sin-cache-fix

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil((async function() {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(function(k){ return caches.delete(k); }));
      await self.clients.claim();
    } catch (e) {}
  })());
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'CLEAR_OLD_CACHES') {
    event.waitUntil(caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }));
  }
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(function() {
      return new Response('Sin conexión. Conéctate a internet y vuelve a abrir Caja.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    })
  );
});
