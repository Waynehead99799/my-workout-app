const CACHE_NAME = "workout-tracker-v2";
const STATIC_ASSETS = [
  "/",
  "/login",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isApiRequest = isSameOrigin && url.pathname.startsWith("/api/");
  const isNavigation = event.request.mode === "navigate";

  // Never cache/intercept API calls.
  if (isApiRequest) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Keep HTML navigations network-first to avoid auth/session issues.
  if (isNavigation) {
    event.respondWith(fetch(event.request).catch(() => caches.match("/login")));
    return;
  }

  const cacheableDestinations = new Set(["style", "script", "font", "image"]);
  const shouldUseCache = isSameOrigin && cacheableDestinations.has(event.request.destination);

  if (!shouldUseCache) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match("/login"));
    })
  );
});
