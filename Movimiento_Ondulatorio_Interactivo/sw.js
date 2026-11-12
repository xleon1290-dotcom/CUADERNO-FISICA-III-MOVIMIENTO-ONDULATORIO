// Service Worker para el Cuaderno Digital Interactivo de Física 3
const CACHE_NAME = 'fisica3-cuaderno-v1.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/book.css',
  './css/components.css',
  './css/geogebra.css',
  './js/app.js',
  './js/geogebra-mas.js',
  './js/geogebra-canvas.js',
  './js/simulation.js',
  './js/mindmap.js',
  './js/timeline.js',
  './js/glossary.js',
  './js/learning.js',
  './js/audio.js',
  './js/math-renderer.js',
  './imagenes/portada.webp',
  './imagenes/hojas.webp',
  './imagenes/portada.png',
  './imagenes/hojas.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => console.warn('PWA caching non-fatal warning:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
