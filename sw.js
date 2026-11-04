/* Public offline shell only. Requests, tips, live video and private admin pages need a connection. */
const CACHE = 'grifflist-livekit-offline-v40';
const CORE = [
  './',
  './index.html',
  './explore.html',
  './watch-live.html',
  './taxi-services.html',
  './offline.html',
  './styles.css?v=grifflist-v41',
  './brand-system.css?v=sitewide-v1',
  './script.js?v=payment-security-pause-1',
  './crowd-favourites.js?v=grifflist-v41',
  './site-interactions.js?v=grifflist-v41',
  './whats-new.js?v=grifflist-v41',
  './live-show.js',
  './grifflist-logo.webp',
  './splash-screen.webp',
  './rock-meter-0.webp',
  './rock-meter-20.webp',
  './rock-meter-40.webp',
  './rock-meter-60.webp',
  './rock-meter-80.webp',
  './rock-meter-100.webp',
  './rock-meter-red.webp',
  './rock-meter-yellow.webp',
  './rock-meter-green.webp',
  './manifest.webmanifest',
  './app-icon.png',
  './secret-highscore-1.mp3',
  './secret-highscore-2.mp3',
  './secret-stage-boot.mp3',
  './secret-menu-select.mp3',
  './secret-pickup.mp3',
  './secret-lost-cassette.mp3',
  './secret-transition.mp3',
  './secret-stage-ambience.ogg',
  './arcade-pick-treynor.png',
  './Title screen.mp3',
  './Menu screen.mp3',
  './cash.mp3',
  './highway_riseR.mp3',
  './notes_ripple_up_01.mp3',
  './scroll.mp3',
  './select.mp3',
  './you_rockR.mp3',
  './ui-sound-01r.mp3',
  './ui-sound-05r.mp3',
  './ui-sound-06r.mp3',
  './ui_sound_09R.mp3',
  './ui_sound_10R.mp3'
];

const CORE_PATHS = new Set(
  CORE.map(path => new URL(path, self.registration.scope).pathname)
);
const PRIVATE_PATHS = new Set([
  '/admin.html',
  '/admin.js',
  '/admin-features.js',
  '/analytics.html',
  '/analytics-dashboard.js',
  '/analytics-tracker.js',
  '/request-archive.html',
  '/request-archive.js',
  '/supabase-config.js'
]);
const PUBLIC_NAVIGATION_PATHS = new Set([
  '/',
  '/index.html',
  '/explore.html',
  '/watch-live.html',
  '/taxi-services.html',
  '/roadmap.html'
]);
const STATIC_DESTINATIONS = new Set([
  'script',
  'style',
  'image',
  'font',
  'audio',
  'manifest'
]);
const API_PREFIXES = [
  '/rest/v1/',
  '/auth/',
  '/functions/v1/',
  '/api/'
];

function isPrivatePath(pathname) {
  const path = pathname.toLowerCase();
  return PRIVATE_PATHS.has(path) ||
    path.startsWith('/admin') ||
    path.startsWith('/analytics') ||
    path.startsWith('/request-archive');
}

function isApiPath(pathname) {
  return API_PREFIXES.some(prefix => pathname.includes(prefix));
}

function isCacheableResponse(response) {
  const cacheControl = response.headers.get('Cache-Control') || '';
  return response.ok &&
    response.type === 'basic' &&
    !/\b(?:no-store|private)\b/i.test(cacheControl) &&
    response.headers.get('Vary') !== '*';
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(
        CORE.map(path => new Request(
          new URL(path, self.registration.scope),
          { cache: 'reload' }
        ))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key =>
          (key.startsWith('grifflist-livekit-offline-') ||
           key.startsWith('grifflist-sober-drive-search-fix-offline-')) &&
          key !== CACHE
        )
        .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (isPrivatePath(url.pathname) || isApiPath(url.pathname)) return;

  const isPublicNavigation =
    request.mode === 'navigate' &&
    PUBLIC_NAVIGATION_PATHS.has(url.pathname);
  const isStaticAsset =
    STATIC_DESTINATIONS.has(request.destination) ||
    CORE_PATHS.has(url.pathname);
  if (!isPublicNavigation && !isStaticAsset) return;

  const networkPromise = fetch(request)
    .then(async response => {
      if (isCacheableResponse(response)) {
        try {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        } catch (_) {
          // Online use must continue if local cache storage is unavailable.
        }
      }
      return response;
    })
    .catch(() => null);

  event.waitUntil(networkPromise.then(() => undefined));
  event.respondWith((async () => {
    let cache = null;
    try {
      cache = await caches.open(CACHE);
    } catch (_) {
      return (await networkPromise) || Response.error();
    }

    const cached = await cache.match(request);
    if (isPublicNavigation) {
      const fresh = await networkPromise;
      if (fresh) return fresh;
      if (cached) return cached;
      return (await cache.match(
        new URL('./offline.html', self.registration.scope)
      )) || Response.error();
    }

    if (cached) return cached;
    return (await networkPromise) || Response.error();
  })());
});
