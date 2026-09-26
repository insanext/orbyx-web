// Service worker mínimo de la PWA de Orbyx (Fase 1 app móvil).
//
// Deliberadamente conservador: NUNCA cachea HTML de páginas ni respuestas
// de API/backend/Supabase -- el dashboard depende de sesión, sucursal
// activa y datos en vivo, y el middleware decide acceso/bloqueo en cada
// request. Solo cachea:
//   - /_next/static/** (archivos con hash, inmutables por deploy)
//   - /icons/** y /offline.html
// Navegaciones van siempre a la red; solo si no hay conexión se muestra
// /offline.html.

const CACHE = "orbyx-shell-v1";
const OFFLINE_URL = "/offline.html";
const MAX_STATIC_ENTRIES = 300;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_STATIC_ENTRIES) return;
  await Promise.all(keys.slice(0, keys.length - MAX_STATIC_ENTRIES).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error()))
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone()).then(() => trimCache(cache));
        }
        return response;
      })
    );
  }
});
