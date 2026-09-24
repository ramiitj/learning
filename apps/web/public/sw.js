/*
 * Offline support. A lesson must work offline once loaded (CLAUDE.md), on
 * low-end phones with slow connections.
 *
 * - Pages: network first, falling back to the cached copy when offline.
 * - Build assets (/_next/static, fonts): cache first; their names are content-hashed.
 * - Everything else same-origin: stale-while-revalidate.
 * - After the first load the page posts every URL it used (CACHE_URLS), so the
 *   files fetched before this worker took control are cached too.
 *
 * Nothing is sent anywhere: this worker only stores the site's own files.
 */
const VERSION = "lm-v1";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (!key.startsWith(VERSION)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

const isImmutable = (url) => url.pathname.startsWith("/_next/static/");
const isPage = (request) => request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html");

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "CACHE_URLS" || !Array.isArray(data.urls)) return;
  const port = event.ports && event.ports[0];
  event.waitUntil(
    (async () => {
      await Promise.all(
        data.urls.map(async (u) => {
          try {
            const url = new URL(u, self.location.origin);
            if (url.origin !== self.location.origin) return;
            const cache = await caches.open(isImmutable(url) ? ASSETS : PAGES);
            if (await cache.match(url.href, { ignoreVary: true })) return;
            const res = await fetch(url.href, { credentials: "same-origin" });
            if (res.ok) await cache.put(url.href, res);
          } catch {
            /* offline or blocked: try again next visit */
          }
        }),
      );
      if (port) port.postMessage({ type: "CACHED" });
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isImmutable(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request, { ignoreVary: true });
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) (await caches.open(ASSETS)).put(request, res.clone());
        return res;
      })(),
    );
    return;
  }

  if (isPage(request)) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (res.ok) (await caches.open(PAGES)).put(request, res.clone());
          return res;
        } catch (err) {
          const cached = await caches.match(request, { ignoreVary: true, ignoreSearch: true });
          if (cached) return cached;
          throw err;
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(PAGES);
      const cached = await cache.match(request, { ignoreVary: true });
      const network = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});
