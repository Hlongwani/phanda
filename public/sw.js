const CACHE = 'phanda-v1';
const OFFLINE_QUEUE_KEY = 'phanda-offline-queue';

// Shell assets to cache on install
const SHELL = ['/', '/dashboard', '/record', '/passport', '/insights', '/history'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Let API POST/PATCH/DELETE through; queue if offline
  if (request.method !== 'GET') {
    e.respondWith(
      fetch(request.clone()).catch(async () => {
        if (request.method === 'POST' && url.pathname.startsWith('/api/transactions')) {
          const body = await request.clone().json().catch(() => ({}));
          const queue = JSON.parse((await self.clients.matchAll().then(() =>
            // Store in IDB via postMessage approach — simplified: use cache as queue
            null
          )) || '[]');
          // Broadcast to client to handle queue
          self.clients.matchAll().then(clients =>
            clients.forEach(c => c.postMessage({ type: 'OFFLINE_QUEUED', payload: { url: url.pathname, body } }))
          );
        }
        return new Response(JSON.stringify({ error: 'offline', queued: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // For GET requests: network-first for API, cache-first for pages/assets
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: 'offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }))
    );
    return;
  }

  // Pages: network first, fall back to cache
  e.respondWith(
    fetch(request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
  );
});
