/* SW killer – rimuove TUTTO il cache e si deregistra IMMEDIATAMENTE */
const CACHE_VERSION = 'v2'; // Incrementa questo per forzare pulizia

self.addEventListener("install", (event) => {
  console.log('[SW] Installing new service worker, force takeover');
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log('[SW] Activating, clearing ALL caches');
  event.waitUntil((async () => {
    try {
      // Cancella TUTTI i cache, non solo quelli con chiavi specifiche
      const cacheNames = await caches.keys();
      console.log('[SW] Found caches:', cacheNames);
      
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      
      console.log('[SW] All caches cleared');
    } catch (e) {
      console.error('[SW] Error clearing caches:', e);
    }
    
    // Prendi controllo di tutti i client
    await self.clients.claim();
    
    // Deregistra il service worker
    await self.registration.unregister();
    console.log('[SW] Service worker unregistered');
    
    // Notifica tutti i client
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    clients.forEach(client => {
      console.log('[SW] Notifying client to reload');
      client.postMessage({ type: "SW_UNREGISTERED" });
    });
  })());
});

// NON aggiungere fetch listener - causa overhead
