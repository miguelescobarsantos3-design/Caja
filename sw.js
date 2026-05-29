
// Caja 2026 — Service Worker
// Versión: 20260525-02
const SW_VERSION = '20260528-01';
const CACHE_NAME = 'caja-2026-' + SW_VERSION;
 
// Archivos esenciales que se cachean al instalar
const SHELL = [
  './',
  './index.html',
  './manifest.json'
];
 
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});
 
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Borrar cachés viejos (de versiones anteriores)
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});
 
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
 
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
 
  // Navegación principal (index.html): red primero, caché como respaldo
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        // Guardar la versión fresca en caché
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        // Sin red: servir del caché
        const cached = await caches.match('./index.html');
        if (cached) return cached;
        return new Response(
          '<!doctype html><meta charset="utf-8"><title>Sin conexión</title><body style="font-family:sans-serif;padding:24px"><h2>Sin conexión</h2><p>Revisa tu internet y vuelve a abrir la app.</p></body>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }
 
  // Todo lo demás: red primero, caché como respaldo
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
