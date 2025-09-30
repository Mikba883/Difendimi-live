// public/sw.js
const VERSION = '2025-09-29-1';
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(STATIC_CACHE));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
          .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// Strategia di cache
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Non cache su domini critici
  const noCacheHosts = ['stripe.com','supabase.co','supabase.in','accounts.google.com'];
  if (noCacheHosts.some(h => url.hostname.includes(h))) return;

  // Navigations (HTML) → NetworkFirst
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(req, { cache: 'no-store' });
      } catch {
        const cache = await caches.open(STATIC_CACHE);
        const fallback = await cache.match('/offline.html');
        return fallback || Response.error();
      }
    })());
    return;
  }

  // Asset statici → StaleWhileRevalidate
  if (/\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|webp)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then(res => {
        cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
  }
});
