const CACHE = 'phanda-v2';

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

  // Pass through non-GET API calls — client handles offline queuing
  if (request.method !== 'GET') {
    e.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline', queued: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // API GETs: network-only, return offline error if down
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Pages & assets: network-first, fall back to cache
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
