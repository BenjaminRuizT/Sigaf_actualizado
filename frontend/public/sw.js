// SIGAF Service Worker v6
// IMPORTANT: Change CACHE_NAME on every deploy to trigger the waiting mechanism.
// The browser compares sw.js byte-by-byte; any change (including this string)
// causes the new SW to install and enter "waiting" state, which triggers the
// update banner in the app without needing skipWaiting on install.
const CACHE_NAME = 'sigaf-v6';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];
const CACHEABLE_API_PATHS = ['/api/stores/plazas', '/api/dashboard/stats'];

self.addEventListener('install', (event) => {
  // Pre-cache static assets but do NOT call skipWaiting here.
  // Staying in "waiting" lets the app show the update banner and
  // only activates after the user explicitly clicks "Recargar".
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isCacheableApi(url) {
  return CACHEABLE_API_PATHS.some(path => url.includes(path));
}
function isAuditReadApi(url) {
  return (url.includes('/api/audits/') || url.includes('/api/stores/')) &&
         !url.includes('/scan') && !url.includes('/finalize');
}

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (event.request.method !== 'GET' && url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline', message: 'Sin conexión.' }), {
          headers: { 'Content-Type': 'application/json' }, status: 503
        })
      )
    );
    return;
  }

  if (url.includes('/api/') && (isCacheableApi(url) || isAuditReadApi(url))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) =>
            cached || new Response(JSON.stringify({ error: 'offline' }), {
              headers: { 'Content-Type': 'application/json' }, status: 503
            })
          )
        )
    );
    return;
  }

  if (url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }, status: 503
        })
      )
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('/index.html'))
      )
  );
});
