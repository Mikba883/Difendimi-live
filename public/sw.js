// Build hash for cache busting - will be replaced at build time
const BUILD_HASH = Date.now().toString();
const CACHE_NAME = `difendimi-ai-v3-${BUILD_HASH}`;
const STATIC_CACHE = `difendimi-static-v3-${BUILD_HASH}`;
const DYNAMIC_CACHE = `difendimi-dynamic-v3-${BUILD_HASH}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install service worker and cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => {
        console.error('[Service Worker] Failed to cache static assets:', err);
      })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate service worker and clean old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete all caches that don't match current version
            return !cacheName.includes(BUILD_HASH);
          })
          .map(cacheName => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - Network first, cache fallback strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip caching for external resources
  if (!url.origin.includes('difendimiai.com') && !url.origin.includes('localhost')) {
    return;
  }
  
  // Skip caching for API calls
  if (url.pathname.includes('/api/') || url.pathname.includes('/auth/')) {
    return;
  }
  
  event.respondWith(
    fetch(request)
      .then(response => {
        // Clone the response as it can only be consumed once
        const responseToCache = response.clone();
        
        // Cache successful responses
        if (response.ok) {
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(async err => {
        console.log('[Service Worker] Network failed, trying cache...', err);
        
        // Try to get from cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          const cache = await caches.open(STATIC_CACHE);
          return cache.match('/index.html');
        }
        
        // Return a basic error response
        return new Response('Network error happened', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync', event);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nuovo aggiornamento disponibile',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Difendimi.AI', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Helper function for background sync
async function syncData() {
  console.log('[Service Worker] Syncing data...');
  // Implement data sync logic here
}