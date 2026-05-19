// Service Worker - Caja 2026 PWA
// Siempre va a la red primero; solo usa cache como fallback offline

const CACHE_NAME = 'caja2026-v3';
const ASSETS_CACHE = 'caja2026-assets-v3';

// Archivos esenciales para funcionar offline
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ─── INSTALL ───────────────────────────────────────────
self.addEventListener('install', function(event) {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(ASSETS_CACHE).then(function(cache) {
      return cache.addAll(CORE_ASSETS).catch(function(e) {
        console.warn('[SW] Error cacheando assets:', e);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ─── ACTIVATE ──────────────────────────────────────────
self.addEventListener('activate', function(event) {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME && key !== ASSETS_CACHE;
        }).map(function(key) {
          console.log('[SW] Eliminando cache viejo:', key);
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ─── FETCH ─────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Firebase y APIs externas: siempre red, nunca cache
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('anthropic') ||
    url.protocol === 'chrome-extension:'
  ) {
    return; // dejar pasar sin interceptar
  }

  // Para todo lo demás: Network First
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(function(response) {
        // Si la respuesta es válida, actualizar cache
        if (response && response.status === 200 && response.type !== 'opaque') {
          var responseClone = response.clone();
          caches.open(ASSETS_CACHE).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Sin red: intentar desde cache
        return caches.match(event.request).then(function(cached) {
          if (cached) {
            console.log('[SW] Offline - sirviendo desde cache:', url.pathname);
            return cached;
          }
          // Fallback final: página principal
          return caches.match('./index.html');
        });
      })
  );
});

// ─── MENSAJE DESDE LA APP ──────────────────────────────
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() {
      event.ports[0].postMessage({ success: true });
    });
  }
});
