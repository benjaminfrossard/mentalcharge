const CACHE_VERSION = 'v4'; // ← bumper à chaque déploiement
const CACHE_NAME = `mentalcharge-${CACHE_VERSION}`;
const ASSETS = [
  './index.html',
  './manifest.json',
  './sw.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first : on essaie le réseau, on tombe sur le cache si offline
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Mettre en cache la réponse fraîche
        if (response && response.status === 200 && e.request.method === 'GET') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./index.html'));
});
