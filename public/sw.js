// Service Worker with improved cache management and versioning
const CACHE_VERSION = new URL(location).searchParams.get('v') || 'v1';
const CACHE_NAME = `difendimi-cache-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html'
];

// Hosts to skip caching (analytics, tracking, etc.)
const SKIP_HOSTS = new Set([
  "connect.facebook.net",
  "www.googletagmanager.com",
  "www.google-analytics.com",
  "capi-automation.s3.us-east-2.amazonaws.com",
]);

console.log('[SW] Installing with cache version:', CACHE_VERSION);

self.addEventListener('install', event => {
  console.log('[SW] Install event, cache version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Opened cache:', CACHE_NAME);
      return cache.addAll(urlsToCache);
    }).then(() => {
      console.log('[SW] Skip waiting to activate immediately');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate event, cache version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete old caches
            return cacheName.startsWith('difendimi-cache-') && cacheName !== CACHE_NAME;
          })
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      self.clients.claim();
      // Notify all clients about activation
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  
  // Skip non-GET requests
  if (req.method !== 'GET') return;
  
  // Skip external tracking/analytics hosts
  const url = new URL(req.url);
  if (SKIP_HOSTS.has(url.hostname)) return;
  
  // Skip Supabase API calls
  if (url.hostname.includes('supabase') || url.pathname.includes('/api/')) {
    return;
  }
  
  // Network-first strategy for HTML navigation
  if (req.mode === 'navigate' || 
      (req.destination === '' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(req).then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(req);
      })
    );
    return;
  }
  
  // Cache-first for static assets (images, CSS, JS)
  event.respondWith(
    caches.match(req).then(response => {
      if (response) {
        // Return cached version but fetch new version in background
        fetch(req).then(fetchResponse => {
          if (fetchResponse && fetchResponse.status === 200) {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(req, responseToCache);
            });
          }
        }).catch(() => {});
        return response;
      }

      // Not in cache, fetch from network
      return fetch(req).then(fetchResponse => {
        if (!fetchResponse || fetchResponse.status !== 200) {
          return fetchResponse;
        }

        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(req, responseToCache);
        });

        return fetchResponse;
      });
    })
  );
});

// Listen for skip waiting message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING, skipping wait');
    self.skipWaiting();
  }
});