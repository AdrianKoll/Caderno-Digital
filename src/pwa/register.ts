/**
 * Registra o service worker (public/sw.js) só no app publicado: no `vite dev`
 * ele atrapalharia o recarregamento rápido (cache de módulos antigos).
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Não foi possível ativar o modo offline:', err);
    });
  });
}
