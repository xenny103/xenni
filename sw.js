// Xenni offline support.
// The app never changes silently: saved files are only replaced when the student taps "Update now" inside the app.
// (Version 1.2.1 uses a new cache name so every phone fetches a clean, fresh copy once.)
const CACHE = 'xenni-app-2';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    const have = await c.keys();
    if (have.length === 0) {   // fill the cache once, straight from the internet (never from an old copy)
      const stamp = Date.now();
      await Promise.all(FILES.map(f => fetch(f + '?nocache=' + stamp, { cache: 'reload' }).then(r => r.ok && c.put(f, r)).catch(() => {})));
    }
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('version.json') || url.searchParams.has('nocache')) return;   // always go to the internet
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then(hit => hit || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  })));
});
