/* Only public shell assets are cached. No API, document, image or business-page interception. */
const CACHE = "PPO-field-shell-__BUILD_HASH__";
const SHELL = [
  "/offline/",
  "/offline/index.html",
  "/offline/style.css",
  ...[
    "offline/app",
    "offline/client",
    "offline/store",
    "offline/protocol",
    "field/validation",
    "shared/validation",
    "platform/validation",
    "platform/errors",
  ].map((x) => `/offline/modules/${x}.js`),
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.search ||
    !SHELL.includes(url.pathname)
  )
    return;
  event.respondWith(
    caches
      .open(CACHE)
      .then(
        async (cache) =>
          (await cache.match(event.request)) ?? fetch(event.request),
      ),
  );
});
// Updates wait for open clients to close. No skipWaiting, background sync, data deletion or API caching.
