const SW_VERSION = 'caja-pwa-firestore-20260519-1900';

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) { return Promise.all(keys.map(function(k) { return caches.delete(k); })); })
      .then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  // Navegación siempre red primero para no cargar index viejo.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(function() {
        return new Response(
          '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión</title></head><body style="font-family:Arial,sans-serif;padding:24px;background:#f0ede6;color:#1a1916"><h2>Caja 2026</h2><p>Sin conexión. Conéctate a internet para cargar y sincronizar Firestore.</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
    );
    return;
  }

  // Assets y Firestore: red directa. Nada de caché viejo.
  event.respondWith(fetch(req).catch(function() { return caches.match(req); }));
});
