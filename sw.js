const VERSION = "caja-red-primero-20260429-01";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request, { cache: "no-store" }).catch(() => {
      return new Response("Sin conexión. Vuelve a intentarlo con internet.", {
        headers: { "Content-Type": "text/plain" },
      });
    })
  );
});
