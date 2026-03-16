const CACHE_VERSION = 'mythatlas-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

const CORE_ASSETS = [
  '/',
  '/map',
  '/discover',
  '/themes',
  '/parallels',
  '/compare',
  '/stats',
  '/offline.html',
  '/icons/mythatlas-icon.svg',
  '/data/mythologies.json',
  '/data/myths.json',
  '/data/deities.json',
  '/data/sacred-sites.json',
  '/data/cultures.json',
  '/data/mythology-regions.geojson',
  '/data/myth-origins.geojson',
  '/data/sacred-sites.geojson',
  '/data/deities.geojson',
  '/data/by-mythology/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(CORE_ASSETS);

      const dataCache = await caches.open(DATA_CACHE);
      const manifestResponse = await fetch('/data/by-mythology/manifest.json');
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        const paths = (manifest.mythologies || []).flatMap((id) => [
          `/data/by-mythology/${id}/region.geojson`,
          `/data/by-mythology/${id}/sites.geojson`,
          `/data/by-mythology/${id}/myths.geojson`,
          `/data/by-mythology/${id}/deities.geojson`,
        ]);
        await Promise.all(paths.map((path) => dataCache.add(path).catch(() => undefined)));
      }
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, DATA_CACHE].includes(key))
          .map((key) => caches.delete(key))
      );
      self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isBuildAsset = url.pathname.startsWith('/_next/');
  const isDataRequest =
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.geojson') ||
    url.pathname.startsWith('/data/');

  // Never cache Next.js build assets; stale chunk references cause 404 loops after deploys.
  if (isBuildAsset) {
    event.respondWith(fetch(request));
    return;
  }

  // Keep route HTML fresh while still supporting offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(STATIC_CACHE);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match('/offline.html');
          if (offline) return offline;
          return Response.error();
        }
      })()
    );
    return;
  }

  if (isDataRequest) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          const cache = await caches.open(DATA_CACHE);
          cache.put(request, response.clone());
          return response;
        } catch {
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        return Response.error();
      }
    })()
  );
});