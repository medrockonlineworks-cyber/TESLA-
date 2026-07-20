const CACHE_NAME = 'tesla-invest-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/screenshot-mobile.svg',
  '/screenshot-desktop.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Standard fetch listener to comply with Chrome's PWA installable requirements
self.addEventListener('fetch', (e) => {
  // Only handle local GET requests (bypass APIs or external SDKs)
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  if (e.request.url.includes('/api/') || e.request.url.includes('firebase') || e.request.url.includes('firestore')) {
    return;
  }

  // Network-First, falling back to cache
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
