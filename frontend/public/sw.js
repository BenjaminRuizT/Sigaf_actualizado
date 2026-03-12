const CACHE_NAME = 'sigaf-cache-v4';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];
const CACHEABLE_API_PATHS = ['/api/stores/plazas', '/api/dashboard/stats'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // Activate immediately — but notify clients so they can show an update banner
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  // Notify all clients that a new version is now active
  self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => client.postMessage({ type: 'SW_ACTIVATED' }));
  });
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
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
