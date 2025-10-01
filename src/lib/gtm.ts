// src/lib/gtm.ts
function buildPreviewQueryFromLocation(): string {
  const src = new URLSearchParams(window.location.search);
  // Tutti i parametri che Tag Assistant può usare
  const keys = [
    "gtm_auth",
    "gtm_preview",
    "gtm_debug",
    "gtm_cookies_win",
    "gtm_troubleshoot"
  ];
  const picked: string[] = [];
  for (const k of keys) {
    const v = src.get(k);
    if (v) picked.push(`${k}=${encodeURIComponent(v)}`);
  }
  return picked.length ? `&${picked.join("&")}` : "";
}

export function initGTM(containerId: string) {
  if (!containerId) return;

  if ((window as any).__gtmLoaded) return;
  (window as any).__gtmLoaded = true;

  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  });

  const firstScript = document.getElementsByTagName("script")[0];
  const gtmScript = document.createElement("script");
  gtmScript.async = true;

  // 👇 Propaghiamo eventuali parametri di preview/debug se presenti nell'URL
  const previewParams = buildPreviewQueryFromLocation();
  gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(
    containerId
  )}${previewParams}`;

  firstScript.parentNode?.insertBefore(gtmScript, firstScript);
}
