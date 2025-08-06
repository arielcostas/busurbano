const CACHE_VERSION = "2025-0806a";
const API_CACHE_NAME = `api-cache-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `static-cache-${CACHE_VERSION}`;

const API_URL_PATTERN = /\/api\/(GetStopList|GetStopEstimates|GetStopTimetable)/;
const API_MAX_AGE = 24 * 60 * 60 * 1000; // 24h
const ESTIMATES_MIN_AGE = 15 * 1000;
const ESTIMATES_MAX_AGE = 30 * 1000;

self.addEventListener("install", (event) => {
  console.log("SW: Installing new version");
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) =>
      cache.addAll([
        "/favicon.ico",
        "/logo-256.png",
        "/logo-512.jpg",
        "/stops.json"
      ])
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  console.log("SW: Activating new version");
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (name !== API_CACHE_NAME && name !== STATIC_CACHE_NAME) {
            console.log("SW: Deleting old cache:", name);
            return caches.delete(name);
          }
        })
      );
      await self.clients.claim();
      const clients = await self.clients.matchAll();
      clients.forEach((client) =>
        client.postMessage({ type: "SW_UPDATED" })
      );
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore requests with unsupported schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API
  if (request.method === "GET" && API_URL_PATTERN.test(url.pathname)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Navegación -> network first
  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Estáticos -> cache first
  if (request.method === "GET") {
    event.respondWith(handleStaticRequest(request));
  }
});

async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isEstimates = url.pathname.includes("GetStopEstimates");
  const maxAge = isEstimates
    ? ESTIMATES_MIN_AGE + Math.random() * (ESTIMATES_MAX_AGE - ESTIMATES_MIN_AGE)
    : API_MAX_AGE;

  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const dateHeader = cachedResponse.headers.get("date");
    const age = dateHeader ? Date.now() - new Date(dateHeader).getTime() : 0;
    if (age && age < maxAge) {
      console.debug("SW: Cache HIT", request.url);
      return cachedResponse;
    }
    cache.delete(request);
  }

  try {
    const netResponse = await fetch(request);
    if (netResponse.ok) cache.put(request, netResponse.clone());
    return netResponse;
  } catch (error) {
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const netResponse = await fetch(request);
    if (netResponse.ok) cache.put(request, netResponse.clone());
    return netResponse;
  } catch (err) {
    return new Response("Offline asset not available", {
      status: 503,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

async function handleNavigationRequest(request) {
  try {
    const netResponse = await fetch(request);
    return netResponse;
  } catch (err) {
    // Si no hay red, intenta fallback con caché estática
    const cache = await caches.open(STATIC_CACHE_NAME);
    const offline = await cache.match("/stops.json");
    return (
      offline ||
      new Response("App offline", {
        status: 503,
        headers: { "Content-Type": "text/plain" }
      })
    );
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
    );
  }
});
