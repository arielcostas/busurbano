const CACHE_VERSION = "20251107a";
const STATIC_CACHE_NAME = `static-cache-${CACHE_VERSION}`;
const STATIC_CACHE_ASSETS = ["/favicon.ico", "/logo-256.png", "/logo-512.jpg"];

const EXPR_CACHE_AFTER_FIRST_VIEW =
  /(\/assets\/.*)|(\/api\/(vigo|santiago)\/GetStopTimetable.*)/;

const ESTIMATES_MIN_AGE = 15 * 1000;
const ESTIMATES_MAX_AGE = 30 * 1000;

self.addEventListener("install", (event) => {
  console.log("SW: Install event in progress. Cache version: ", CACHE_VERSION);
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const doCleanup = async () => {
    // Cleans the old caches
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((name) => {
        if (name !== STATIC_CACHE_NAME) {
          return caches.delete(name);
        }
      })
    );

    await self.clients.claim();
  };

  event.waitUntil(doCleanup());
});

self.addEventListener("fetch", async (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore requests with unsupported schemes
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Navigating => we don't intercept anything, if it fails, good luck
  if (request.mode === "navigate") {
    return;
  }

  // Static => cache first, if not, network; if not, fallback
  const isAssetCacheable =
    STATIC_CACHE_ASSETS.includes(url.pathname) ||
    EXPR_CACHE_AFTER_FIRST_VIEW.test(url.pathname);
  if (request.method === "GET" && isAssetCacheable) {
    const response = handleStaticRequest(request);
    if (response !== null) {
      event.respondWith(response);
    }
    return;
  }
});

async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log("SW handleStaticRequest: HIT for ", request.url);
    return cachedResponse;
  }

  try {
    const netResponse = await fetch(request);
    if (netResponse.ok) cache.put(request, netResponse.clone());
    console.log("SW handleStaticRequest: MISS for ", request.url);
    return netResponse;
  } catch (err) {
    console.error("SW handleStaticRequest: FAIL for ", request.url, err);
    return null;
  }
}
