/* SW v2 – cache sicura con filtri (VER-0933) */
(() => {
  const SKIP_HOSTS = new Set([
    "connect.facebook.net",
    "www.googletagmanager.com",
    "www.google-analytics.com",
    "capi-automation.s3.us-east-2.amazonaws.com",
  ]);

  const isHTMLNav = (req) =>
    req.mode === "navigate" ||
    (req.destination === "" && req.headers.get("accept")?.includes("text/html"));

  self.addEventListener("install", (event) => {
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
      await self.clients.claim();
    })());
  });

  self.addEventListener("fetch", (event) => {
    const req = event.request;

    // Solo GET
    if (req.method !== "GET") return;

    // Solo http/https (niente chrome-extension:, file:, ecc.)
    const url = new URL(req.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") return;

    // Evita host terzi "rumorosi"
    if (SKIP_HOSTS.has(url.hostname)) return;

    // A) Navigazioni HTML => network-first con fallback cache
    if (isHTMLNav(req)) {
      event.respondWith((async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          const c = await caches.open("runtime");
          c.put(req, fresh.clone());
          return fresh;
        } catch {
          const c = await caches.open("runtime");
          const cached = await c.match(req);
          return cached || new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })());
      return;
    }

    // B) Asset statici => cache-first
    const isAsset = url.pathname.startsWith("/assets/") ||
      ["script","style","font","image"].includes(req.destination);
    if (isAsset) {
      event.respondWith((async () => {
        const c = await caches.open("static");
        const cached = await c.match(req);
        if (cached) return cached;
        const fresh = await fetch(req);
        c.put(req, fresh.clone());
        return fresh;
      })());
      return;
    }

    // C) Altri GET => stale-while-revalidate semplice
    event.respondWith((async () => {
      const c = await caches.open("runtime");
      const cached = await c.match(req);
      const freshP = fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => null);
      return cached || (await freshP) || fetch(req);
    })());
  });
})();
