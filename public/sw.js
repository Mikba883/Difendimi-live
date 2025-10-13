/* SW killer – rimuove cache e si deregistra */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (e) {}
    await self.clients.claim();
    await self.registration.unregister();
    const cs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    cs.forEach(c => c.postMessage({ type: "SW_UNREGISTERED" }));
  })());
});