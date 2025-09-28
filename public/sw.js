// Define el nombre de la caché
const CACHE_NAME = 'physikbreak-cache-v1';
// Archivos para cachear
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/sounds/brick-hit.mp3',
  '/sounds/level-complete.mp3',
  '/sounds/lose-life.mp3',
  '/sounds/paddle-hit.mp3',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercepta las peticiones de red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la respuesta está en la caché, la devuelve
        if (response) {
          return response;
        }

        // Si no, la busca en la red, la devuelve y la añade a la caché
        return fetch(event.request).then(
          response => {
            // Comprueba si hemos recibido una respuesta válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

// Activación del Service Worker y limpieza de cachés antiguas
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
