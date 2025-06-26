const API_CACHE_NAME = "api-cache-v1";
const API_URL_PATTERN = /\/api\/(GetStopList)/;
const API_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", async (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET" || !API_URL_PATTERN.test(url.pathname)) {
    return;
  }

  event.respondWith(apiCacheFirst(event.request));
});

async function apiCacheFirst(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const age =
      Date.now() - new Date(cachedResponse.headers.get("date")).getTime();
    if (age < API_MAX_AGE) {
      console.debug(`SW: Cache HIT for ${request.url}`);
      return cachedResponse;
    }

    // Cache is too old, fetch a fresh copy
    cache.delete(request);
  }

  try {
    const netResponse = await fetch(request);

    const responseToCache = netResponse.clone();

    cache.put(request, responseToCache);

    console.debug(`SW: Cache MISS for ${request.url}`);

    return netResponse;
  } catch (error) {
    throw error;
  }
}
