/*
 * Habilita cross-origin isolation (COOP/COEP) no GitHub Pages via Service Worker.
 * Isso libera SharedArrayBuffer → sort de splats com memória compartilhada + GPU.
 * Baseado em gzuidhof/coi-serviceworker (MIT).
 */
if (typeof window === 'undefined') {
  // ===== contexto: service worker =====
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
  self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
    e.respondWith(
      fetch(req).then((res) => {
        if (res.status === 0) return res;
        const headers = new Headers(res.headers);
        headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
        headers.set('Cross-Origin-Opener-Policy', 'same-origin');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
      }).catch((err) => console.error('coi-sw:', err))
    );
  });
} else {
  // ===== contexto: página =====
  (async () => {
    try {
      if (window.crossOriginIsolated) return;               // já isolado
      if (!('serviceWorker' in navigator)) return;          // sem suporte (ex.: file://)
      if (location.protocol === 'file:') return;
      const reg = await navigator.serviceWorker.register(document.currentScript.src);
      // recarrega uma única vez para o SW passar a controlar a página
      if (!navigator.serviceWorker.controller && !sessionStorage.getItem('coiReload')) {
        sessionStorage.setItem('coiReload', '1');
        await new Promise(r => setTimeout(r, 150));
        window.location.reload();
      }
    } catch (e) {
      console.warn('coi-sw: não ativado —', e);
    }
  })();
}
