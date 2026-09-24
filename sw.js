// Minimal service worker for the NAMUYIMBA and SONS dashboard.
// Purpose: (1) let Chrome/Android treat this site as an installable app,
// (2) cache the app shell (index.html) so it still opens with no internet.
// Live data (tenants, ledger, complaints, payments) always comes from
// Firestore when online — this cache is only a fallback for the page itself.

const CACHE_NAME = 'namuyimba-shell-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first for the app shell so users always get the latest version
// when online; falls back to the cached copy only when offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
