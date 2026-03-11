const CACHE_NAME = 'hekayaty-v2-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/dashboard',
  '/marketplace',
  '/worldbuilders',
  '/cart',
  '/favicon.png',
  '/robots.txt'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests like Cloudinary/Google Fonts for now
  // or handle them with specific strategies
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache static assets dynamically
        if (
          event.request.url.includes('.js') || 
          event.request.url.includes('.css') || 
          event.request.url.includes('.png') ||
          event.request.url.includes('.jpg') ||
          event.request.url.includes('.svg')
        ) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }
        return fetchResponse;
      });
    })
  );
});
