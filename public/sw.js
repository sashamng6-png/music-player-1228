/* Music Player 1228 — service worker.
 *
 * Дає змогу встановити застосунок і відкривати його офлайн:
 * - навігація: спершу мережа, у разі відсутності інтернету — кешована оболонка;
 * - статика (JS/CSS/шрифти/іконки): спершу кеш, у фоні тихо оновлюється;
 * - аудіо та запити до Supabase не кешуються, щоб не з'їдати диск і трафік.
 */

const CACHE_NAME = 'mp1228-shell-v4';
const SHELL_URLS = ['./', './index.html', './manifest.webmanifest'];
const CACHEABLE_DESTINATIONS = ['script', 'style', 'image', 'font', 'manifest'];

async function precacheShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    SHELL_URLS.map((url) =>
      cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined),
    ),
  );

  /* Хешовані імена index-xxxx.js/css відомі лише після збірки, тому читаємо
     їх із щойно закешованого index.html — так офлайн-режим працює одразу. */
  try {
    const html = await cache.match('./index.html');
    const source = html ? await html.text() : '';
    const assets = [...source.matchAll(/(?:src|href)="(\.\/[^"]+\.(?:js|css|woff2?))"/g)].map(
      (match) => match[1],
    );
    await Promise.all(assets.map((url) => cache.add(url).catch(() => undefined)));
  } catch {
    /* без попереднього кешу застосунок усе одно відкриється онлайн */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await precacheShell();
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('mp1228-shell-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put('./index.html', response.clone());
    }
    return response;
  } catch {
    const cached = (await cache.match(request)) || (await cache.match('./index.html'));
    return cached || Response.error();
  }
}

function staleWhileRevalidate(event) {
  const { request } = event;
  return (async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const network = fetch(request)
      .then((response) => {
        if (response && response.ok && response.type === 'basic') {
          return cache.put(request, response.clone()).then(() => response);
        }
        return response;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(network);
      return cached;
    }
    const fresh = await network;
    return fresh || Response.error();
  })();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const scope = new URL(self.registration.scope).pathname;
  if (!url.pathname.startsWith(scope)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (!CACHEABLE_DESTINATIONS.includes(request.destination)) return;
  event.respondWith(staleWhileRevalidate(event));
});
