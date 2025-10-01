module.exports = {
  // Niente precache: solo runtime caching per evitare asset stantii
  globDirectory: ".",
  globPatterns: [],

  // Genera direttamente lo sw pubblico
  swDest: "public/sw.js",

  clientsClaim: true,
  skipWaiting: true,
  ignoreURLParametersMatching: [/^v$/, /^build$/],

  runtimeCaching: [
    {
      // HTML navigations => NetworkFirst
      urlPattern: ({request}) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "html",
        networkTimeoutSeconds: 3
      }
    },
    {
      // Asset first-party (/assets, script/style/font/image)
      urlPattern: ({url, request}) =>
        url.origin === self.location.origin &&
        (url.pathname.startsWith("/assets/") || ["script","style","font","image"].includes(request.destination)),
      handler: "StaleWhileRevalidate",
      options: { cacheName: "assets" }
    }
  ]
};
