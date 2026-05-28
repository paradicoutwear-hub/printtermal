const CACHE_NAME = 'thermalprint-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './lib/pdf.min.js',
  './lib/pdf.worker.min.js'
];

// Instal SW dan simpan cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Hapus cache lama jika ada update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Ambil dari cache jika offline (Cache First strategy)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Jika gagal ambil dari network dan tidak ada di cache (berarti offline murni)
        // Kita tidak bisa melakukan apa-apa lagi selain fail secara anggun
        console.warn('[SW] Fetch failed & no cache fallback for', event.request.url);
      });
    })
  );
});
