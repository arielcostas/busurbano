const CACHE_VERSION = "v2";
const API_CACHE_NAME = `api-cache-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `static-cache-${CACHE_VERSION}`;
const API_URL_PATTERN = /\/api\/(GetStopList|GetStopEstimates|GetStopTimetable)/;
const API_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const ESTIMATES_MIN_AGE = 15 * 1000; // 15 seconds minimum
const ESTIMATES_MAX_AGE = 30 * 1000; // 30 seconds maximum

self.addEventListener("install", (event) => {
  console.log("SW: Installing new version");
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/manifest.webmanifest",
        "/stops.json",
        "/favicon.ico",
        "/logo-256.png",
        "/logo-512.jpg"
      ]);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("SW: Activating new version");
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== API_CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log("SW: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim(),
      // Notify clients about the update
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SW_UPDATED" });
        });
      })
    ])
  );
});

self.addEventListener("fetch", async (event) => {
  const url = new URL(event.request.url);

  // Handle API requests with caching
  if (event.request.method === "GET" && API_URL_PATTERN.test(url.pathname)) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle static assets
  if (event.request.method === "GET") {
    event.respondWith(handleStaticRequest(event.request));
    return;
  }
});

async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isEstimates = url.pathname.includes("GetStopEstimates");
  // Random cache age between 15-30 seconds for estimates to prevent thundering herd
  const maxAge = isEstimates 
    ? ESTIMATES_MIN_AGE + Math.random() * (ESTIMATES_MAX_AGE - ESTIMATES_MIN_AGE)
    : API_MAX_AGE;
  
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const age = Date.now() - new Date(cachedResponse.headers.get("date")).getTime();
    if (age < maxAge) {
      console.debug(`SW: Cache HIT for ${request.url}`);
      return cachedResponse;
    }
    // Cache is too old, fetch a fresh copy
    cache.delete(request);
  }

  try {
    const netResponse = await fetch(request);
    
    if (netResponse.ok) {
      const responseToCache = netResponse.clone();
      cache.put(request, responseToCache);
      console.debug(`SW: Cache MISS for ${request.url}`);
    }

    return netResponse;
  } catch (error) {
    // If network fails and we have a cached response (even if old), return it
    if (cachedResponse) {
      console.debug(`SW: Network failed, returning stale cache for ${request.url}`);
      return cachedResponse;
    }
    throw error;
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const netResponse = await fetch(request);
    if (netResponse.ok) {
      cache.put(request, netResponse.clone());
    }
    return netResponse;
  } catch (error) {
    // Return a basic offline page for navigation requests
    if (request.mode === 'navigate') {
      return new Response('App is offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    throw error;
  }
}

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
