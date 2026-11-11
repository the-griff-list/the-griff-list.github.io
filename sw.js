/* Public offline shell only. Requests, tips, live video and private admin pages need a connection. */
const CACHE = 'grifflist-livekit-offline-v63';
// Limit simultaneous media/asset fetches during installation on memory-constrained phones.
const PRECACHE_CONCURRENCY = 4;
const CORE = [
  './',
  './index.html',
  './explore.html',
  './watch-live.html',
  './taxi-services.html',
  './roadmap.html',
  './offline.html',
  './styles.css?v=grifflist-v41',
  './styles.css?v=grifflist-tour-roadmap-1',
  './brand-system.css?v=sitewide-v2',
  './script.js?v=payment-security-pause-1',
  './script.js?v=grifflist-v28',
  './crowd-favourites.js?v=grifflist-v41',
  './site-interactions.js?v=grifflist-v41',
  './site-interactions.js?v=grifflist-v39',
  './whats-new.js?v=grifflist-v41',
  './recording-safety.js?v=rights-gate-1',
  './live-show.js',
  './live-show.js?v=grifflist-v31',
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

const CORE_URLS = new Set(
  CORE.map(path => new URL(path, self.registration.scope).href)
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
  '/storage/v1/',
  '/graphql/v1/',
  '/realtime/v1/',
  '/api/'
];

// Compare raw and repeatedly decoded path forms before deciding what may
// enter the public offline cache. Proxies/servers can normalize encoded paths
// differently from URL.pathname; malformed or excessively encoded paths fail
// closed rather than being treated as public assets.
function normalizePathCandidate(pathname) {
  const withSeparators = pathname.replace(/\\/g, '/');
  // Reject decoded C0/DEL controls because upstream path normalizers may disagree on them.
  if (!withSeparators.startsWith('/') || /[\u0000-\u001f\u007f]/.test(withSeparators)) return null;

  // Decoding can reveal traversal segments that the URL parser did not see
  // in the original encoded pathname. Reject them rather than collapsing:
  // a proxy/origin may normalize a path differently, so collapsing could hide
  // a private/API prefix before the request reaches its final handler.
  const segments = [];
  for (const segment of withSeparators.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') return null;
    segments.push(segment);
  }

  const hasTrailingSlash = withSeparators.endsWith('/') || withSeparators.endsWith('/.') || withSeparators.endsWith('/..');
  const normalized = `/${segments.join('/')}`;
  return (hasTrailingSlash && normalized !== '/' ? `${normalized}/` : normalized).toLowerCase();
}

function canonicalPathCandidates(pathname) {
  const candidates = new Set();
  let current = pathname;
  for (let depth = 0; depth < 4; depth += 1) {
    const normalized = normalizePathCandidate(current);
    if (normalized === null) return null;
    candidates.add(normalized);
    let decoded;
    try {
      decoded = decodeURIComponent(current);
    } catch (_) {
      return null;
    }
    if (decoded === current) return candidates;
    current = decoded;
  }
  if (current.includes('%')) return null;
  const normalized = normalizePathCandidate(current);
  if (normalized === null) return null;
  candidates.add(normalized);
  return candidates;
}
function isPrivatePath(pathname) {
  const candidates = canonicalPathCandidates(pathname);
  if (candidates === null) return true;
  return [...candidates].some(path =>
    PRIVATE_PATHS.has(path) ||
    path.startsWith('/admin') ||
    path.startsWith('/analytics') ||
    path.startsWith('/request-archive') ||
    path.startsWith('/supabase-config.js')
  );
}

function isApiPath(pathname) {
  const candidates = canonicalPathCandidates(pathname);
  if (candidates === null) return true;
  return [...candidates].some(path =>
    API_PREFIXES.some(prefix =>
      path === prefix.slice(0, -1) || path.includes(prefix)
    )
  );
}

function isCacheableRequest(request, url) {
  // Cache API does not automatically honor Fetch cache modes or request directives.
  // Explicit cache-bypass requests must not be served from or persisted to this cache.
  const requestCacheControl = (request.headers.get('Cache-Control') || '')
    .split(',')
    .map(value => value.trim().toLowerCase());
  const hasRequestNoCache = requestCacheControl.some(value => {
    const directive = value.split('=', 1)[0].trim();
    return directive === 'no-store' ||
      directive === 'no-cache' ||
      /^max-age\s*=\s*"?0+"?$/i.test(value);
  });
  const hasPragmaNoCache = (request.headers.get('Pragma') || '')
    .split(',')
    .some(value => value.trim().toLowerCase() === 'no-cache');
  if (['no-store', 'no-cache', 'reload'].includes(request.cache) ||
      hasRequestNoCache || hasPragmaNoCache) return false;

  if (request.method !== 'GET' || request.headers.has('Range') || url.origin !== self.location.origin) return false;
  if (request.headers.has('Authorization')) return false;
  if (isPrivatePath(url.pathname) || isApiPath(url.pathname)) return false;

  const isPublicNavigation =
    request.mode === 'navigate' &&
    PUBLIC_NAVIGATION_PATHS.has(url.pathname) &&
    url.search === '';
  const isPinnedCoreAsset = CORE_URLS.has(url.href);
  const isUnversionedStaticAsset =
    url.search === '' && STATIC_DESTINATIONS.has(request.destination);

  return isPublicNavigation || isPinnedCoreAsset || isUnversionedStaticAsset;
}

function isSafePublicCacheResponse(response, requestUrl, origin) {
  if (!response || response.redirected) return false;
  let request;
  let finalResponse;
  try {
    request = new URL(requestUrl);
    finalResponse = new URL(response.url);
  } catch (_) {
    return false;
  }
  if (request.origin !== origin || finalResponse.origin !== origin) return false;
  return !isPrivatePath(request.pathname) &&
    !isApiPath(request.pathname) &&
    !isPrivatePath(finalResponse.pathname) &&
    !isApiPath(finalResponse.pathname);
}

function isCacheableResponse(response) {
  const cacheControl = response.headers.get('Cache-Control') || '';
  const cacheDirectives = cacheControl.split(',').map(value => value.trim());
  const directiveNames = cacheDirectives.map(value =>
    value.split('=', 1)[0].trim().toLowerCase()
  );
  // Cache API does not enforce HTTP freshness/revalidation directives. Since
  // this worker may serve cached static assets without contacting the origin,
  // conservatively refuse responses that require validation before reuse.
  const forbiddenDirectives = new Set([
    'no-store',
    'no-cache',
    'private',
    'must-revalidate',
    'proxy-revalidate'
  ]);
  const hasZeroFreshness = cacheDirectives.some(value => {
    const match = /^(?:max-age|s-maxage)\s*=\s*"?([0-9]+)"?$/i.exec(value);
    return match !== null && Number(match[1]) === 0;
  });
  const pragma = response.headers.get('Pragma') || '';
  const hasLegacyNoCache = pragma.split(',').some(value =>
    value.trim().toLowerCase() === 'no-cache'
  );
  const vary = (response.headers.get('Vary') || '')
    .split(',')
    .map(value => value.trim().toLowerCase());
  // Cache API does not safely model partial byte-range responses as complete assets.
  return response.status === 200 &&
    response.ok &&
    response.type === 'basic' &&
    !directiveNames.some(name => forbiddenDirectives.has(name)) &&
    !hasZeroFreshness &&
    !hasLegacyNoCache &&
    !vary.includes('*') &&
    !vary.includes('cookie') &&
    !vary.includes('authorization');
}

// Only credentialless responses may be persisted. Same-origin requests can
// carry session cookies even when they target otherwise-public shell paths.
function isCacheableResponseForRequest(request, response) {
  return request.credentials === 'omit' &&
    !request.headers.has('Authorization') &&
    isCacheableResponse(response);
}

async function precachePublicShell(cache) {
  let nextIndex = 0;
  let failed = false;
  let failure;

  const worker = async () => {
    while (!failed) {
      const index = nextIndex++;
      if (index >= CORE.length) return;
      const path = CORE[index];
      try {
        const request = new Request(
          new URL(path, self.registration.scope),
          { cache: 'reload', credentials: 'omit' }
        );
        const response = await fetch(request);
        if (!isCacheableResponseForRequest(request, response) ||
            !isSafePublicCacheResponse(response, request.url, self.location.origin)) {
          throw new Error(`Refusing to precache a non-public or non-cacheable response: ${request.url}`);
        }
        await cache.put(request, response);
      } catch (error) {
        if (!failed) {
          failed = true;
          failure = error;
        }
        return;
      }
    }
  };

  // Promise.all waits for every worker, including already-started writes. Once
  // one task fails, workers stop claiming new assets; cleanup therefore cannot
  // race with a late sibling cache.put().
  const workerCount = Math.min(PRECACHE_CONCURRENCY, CORE.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (failed) {
    try {
      await caches.delete(CACHE);
    } catch (_) {
      // Preserve the original install failure if CacheStorage cleanup is unavailable.
    }
    throw failure;
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => precachePublicShell(cache))
      .then(() => self.skipWaiting())
  );
});
function cacheGeneration(key) {
  const match = /-v([0-9]+)$/.exec(key);
  return match ? Number(match[1]) : -1;
}

// Retire older caches before the immediately previous livekit generation.
// If any old-cache deletion fails, the previous active worker's cache remains
// available for rollback and clients are not claimed by this worker.
async function retireObsoleteCaches(keys) {
  const obsolete = keys.filter(key =>
    (key.startsWith('grifflist-livekit-offline-') ||
     key.startsWith('grifflist-sober-drive-search-fix-offline-')) &&
    key !== CACHE
  );
  const currentMatch = /^grifflist-livekit-offline-v([0-9]+)$/.exec(CACHE);
  const currentGeneration = currentMatch
    ? Number(currentMatch[1])
    : Number.POSITIVE_INFINITY;
  const previousLivekit = obsolete
    .filter(key => {
      const match = /^grifflist-livekit-offline-v([0-9]+)$/.exec(key);
      return match !== null && Number(match[1]) < currentGeneration;
    })
    .sort((left, right) =>
      cacheGeneration(right) - cacheGeneration(left) ||
      left.localeCompare(right)
    )[0];
  const previousCache = previousLivekit ??
    obsolete
      .filter(key => key.startsWith('grifflist-sober-drive-search-fix-offline-'))
      .sort((left, right) =>
        cacheGeneration(right) - cacheGeneration(left) ||
        left.localeCompare(right)
      )[0] ??
    obsolete
      .slice()
      .sort((left, right) =>
        cacheGeneration(right) - cacheGeneration(left) ||
        left.localeCompare(right)
      )[0];

  const olderCaches = obsolete
    .filter(key => key !== previousCache)
    .sort();
  for (const key of olderCaches) {
    await caches.delete(key);
  }
  if (previousCache !== undefined) {
    await caches.delete(previousCache);
  }
}

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(retireObsoleteCaches)
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (!isCacheableRequest(request, url)) return;

  const isPublicNavigation =
    request.mode === 'navigate' &&
    PUBLIC_NAVIGATION_PATHS.has(url.pathname) &&
    url.search === '';

  const networkPromise = fetch(request)
    .then(async response => {
      if (isCacheableResponseForRequest(request, response) &&
          isSafePublicCacheResponse(response, request.url, self.location.origin)) {
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

    let cached = null;
    try {
      cached = await cache.match(request);
    } catch (_) {
      // CacheStorage read failures must not prevent an otherwise-available network response.
    }
    if (isPublicNavigation) {
      const fresh = await networkPromise;
      if (fresh) return fresh;
      if (cached) return cached;
      let offline = null;
      try {
        offline = await cache.match(
          new URL('./offline.html', self.registration.scope)
        );
      } catch (_) {
        // If CacheStorage itself is unavailable, fail only the offline fallback.
      }
      return offline || Response.error();
    }

    if (cached) return cached;
    return (await networkPromise) || Response.error();
  })());
});
