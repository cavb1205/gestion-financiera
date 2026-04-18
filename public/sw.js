// Incrementar VERSION al desplegar cambios para forzar actualización de caché
const VERSION = '3';
const CACHE_NAME = `cartera-shell-v${VERSION}`;
const STATIC_CACHE = `cartera-static-v${VERSION}`;
const API_HOST = self.location.hostname;

// Rutas del app shell que se precargan al instalar
const PRECACHE_URLS = [
  '/login',
  '/dashboard',
  '/offline',
];

// ── Install: precarga el shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {})
    )
  );
  self.skipWaiting();
});

// ── Activate: limpia cachés viejos ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar GET del mismo origen
  if (request.method !== 'GET') return;
  if (url.hostname !== API_HOST) return;

  // Llamadas a la API del backend → siempre red, nunca caché
  if (
    url.pathname.startsWith('/api/') ||
    url.port === '8000' ||
    url.hostname.includes('api.')
  ) {
    return;
  }

  // Assets estáticos de Next.js (_next/static/) → cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // Páginas y navegación → network-first, caché como fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(request, response.clone())
          );
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached || caches.match('/offline')
        )
      )
  );
});
