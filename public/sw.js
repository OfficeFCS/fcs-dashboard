// =====================================================
//  FCS Dashboard — Service Worker
//
//  Enables PWA (Progressive Web App) support so the
//  dashboard can be installed on phones and tablets.
//
//  Strategy: cache-first for static assets (CSS, JS,
//  logo) so the app loads fast on repeat visits.
//  Everything else (API calls, HTML) always goes to
//  the network so data is always fresh.
//
//  To bust the cache after a deployment, bump the
//  CACHE version string below (e.g. fcs-v2, fcs-v3).
// =====================================================

const CACHE  = 'fcs-v1';

// Static assets to pre-cache on install
const STATIC = ['/style.css', '/app.js', '/FCS-Logo-remove.png'];

// Install — pre-cache static assets and activate immediately
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting(); // don't wait for old SW to stop
});

// Activate — delete any old cache versions left from previous deploys
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control of open tabs immediately
});

// Fetch — serve static assets from cache, everything else from network
self.addEventListener('fetch', e => {
  if (STATIC.some(path => e.request.url.endsWith(path))) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
