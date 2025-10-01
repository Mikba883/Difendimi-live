// src/lib/gtm.ts
export function initGTM(containerId: string) {
  if (!containerId) return;

  // Evita doppie inizializzazioni
  if ((window as any).__gtmLoaded) return;
  (window as any).__gtmLoaded = true;

  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  const firstScript = document.getElementsByTagName('script')[0];
  const gtmScript = document.createElement('script');
  gtmScript.async = true;
  gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  firstScript.parentNode?.insertBefore(gtmScript, firstScript);
}
