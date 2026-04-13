const CACHE_VERSION = 'v15'; // ← bumper à chaque déploiement
const CACHE_NAME = `mentalcharge-${CACHE_VERSION}`;
const ASSETS = [
  './index.html',
  './manifest.json',
  './sw.js'
];

// URLs à ne jamais intercepter (APIs externes)
const BYPASS_URLS = [
  'api.anthropic.com',
  'googleapis.com',
  'accounts.google.com',
  'open-meteo.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
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
  const url = e.request.url;

  // Laisser passer toutes les requêtes vers des APIs externes
  if (BYPASS_URLS.some(domain => url.includes(domain))) {
    return; // Ne pas appeler e.respondWith → le navigateur gère directement
  }

  // Network-first pour les assets de l'app
  e.respondWith(
    fetch(e.request)
      .then(response => {
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
