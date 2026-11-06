/*
 * Service worker do Caderno Digital (PWA offline).
 *
 *  - Navegação (HTML):   rede primeiro, com o último HTML guardado como reserva (abre offline).
 *  - /assets/* (hash):   cache primeiro — os arquivos têm hash no nome, nunca mudam.
 *  - Fontes e estilos de outros domínios (Google Fonts, fontes do Excalidraw):
 *                        "stale-while-revalidate" — usa o guardado e atualiza em segundo plano.
 *  - Tudo o que é dado (IndexedDB) fica no aparelho e não passa por aqui.
 *
 * Para publicar uma versão nova do app, troque VERSION (descarta os caches antigos).
 */
<<<<<<< HEAD
const VERSION = 'v3';
=======
const VERSION = 'v2';
>>>>>>> origin/main
const SHELL = `cd-shell-${VERSION}`;
const STATIC = `cd-static-${VERSION}`;
const RUNTIME = `cd-runtime-${VERSION}`;
const KEEP = [SHELL, STATIC, RUNTIME];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
<<<<<<< HEAD
      .then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/favicon.svg', '/icons/brand-256.png']))
=======
      .then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/favicon.svg']))
>>>>>>> origin/main
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('cd-') && !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirstPage(request) {
  const cache = await caches.open(SHELL);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put('/', fresh.clone());
    return fresh;
  } catch {
    return (await cache.match('/')) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const update = fetch(request)
    .then((res) => {
      // "opaque" (no-cors) também vale: é o caso das fontes de outros domínios.
      if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
      return res;
    })
    .catch(() => undefined);
  return hit || (await update) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    // Só a página do app. Arquivos abertos numa aba (ex.: /third-party-licenses.txt)
    // seguem direto para a rede — senão o texto deles sobrescreveria o HTML guardado em "/".
    if (/\.[a-z0-9]+$/i.test(url.pathname)) return;
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
      event.respondWith(cacheFirst(request, STATIC));
    }
    return; // o resto (ex.: /sw.js) segue direto para a rede
  }

  // Outros domínios: só fontes e folhas de estilo.
  if (request.destination === 'font' || request.destination === 'style' || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME));
  }
});
