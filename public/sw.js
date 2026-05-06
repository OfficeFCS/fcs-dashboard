// Service worker — caches static assets for faster loads
const CACHE = 'fcs-v1';
const STATIC = ['/style.css', '/app.js', '/FCS-Logo-remove.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Clear old caches when a new version is deployed
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only serve static assets from cache — everything else goes to network
  if (STATIC.some(path => e.request.url.endsWith(path))) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
