const CACHE_NAME = 'hekayaty-v2-cache-v2'; // Incremented version to clear old stale cache
const ASSETS_TO_CACHE = [
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
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);

  // Strategy for HTML/Pages: Network First
  // This ensures we always check for the latest version of the app (index.html)
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update the cache with the fresh response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request)) // Fallback to cache if network fails
    );
    return;
  }

  // Strategy for Static Assets (JS, CSS, Images): Cache First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        // Cache static assets dynamically
        if (
          url.pathname.includes('.js') || 
          url.pathname.includes('.css') || 
          url.pathname.includes('.png') ||
          url.pathname.includes('.jpg') ||
          url.pathname.includes('.svg') ||
          url.pathname.includes('.woff') ||
          url.pathname.includes('.woff2')
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      });
    })
  );
});

