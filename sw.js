// Service Worker - Network First (siempre carga de red)
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Borrar TODO el caché viejo
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  // SIEMPRE va a la red primero - nunca usa caché
  e.respondWith(
    fetch(e.request, {cache: 'no-store'}).catch(function() {
      return caches.match(e.request);
    })
  );
});
