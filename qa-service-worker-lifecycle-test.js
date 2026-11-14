#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ORIGIN = 'https://griff-list.test';
const listeners = new Map();
let cacheData = new Map();
let failCacheMatch = false;
let failCacheOpen = false;
let failCachePut = false;
let failCacheDeleteFor = new Set();
let fetchImpl;
let fetchCalls = 0;
let fetchedRequests = [];
let activeFetches = 0;
let peakActiveFetches = 0;
let skipWaitingCalls = 0;
let claimCalls = 0;

function response(url, { redirected = false, cacheControl = 'public, max-age=3600' } = {}) {
  return {
    url,
    status: 200,
    ok: true,
    type: 'basic',
    redirected,
    headers: new Headers({ 'Cache-Control': cacheControl }),
    clone() {
      return response(url, { redirected, cacheControl });
    },
  };
}

function cacheKey(value) {
  if (typeof value === 'string') return value;
  return value.url || value.href;
}

const caches = {
  async open(name) {
    if (failCacheOpen) throw new Error('simulated CacheStorage.open failure');
    if (!cacheData.has(name)) cacheData.set(name, new Map());
    const entries = cacheData.get(name);
    return {
      async put(request, value) {
        if (failCachePut) throw new Error('simulated CacheStorage.put failure');
        entries.set(cacheKey(request), value);
      },
      async match(request) {
        if (failCacheMatch) throw new Error('simulated CacheStorage.match failure');
        return entries.get(cacheKey(request)) || null;
      },
    };
  },
  async keys() {
    return [...cacheData.keys()];
  },
  async delete(name) {
    if (failCacheDeleteFor.has(name)) throw new Error('simulated CacheStorage.delete failure');
    return cacheData.delete(name);
  },
};

const self = {
  location: { origin: ORIGIN },
  registration: { scope: ORIGIN + '/' },
  addEventListener(name, callback) {
    listeners.set(name, callback);
  },
  async skipWaiting() {
    skipWaitingCalls += 1;
  },
  clients: {
    async claim() {
      claimCalls += 1;
    },
  },
};

fetchImpl = async request => {
  fetchCalls += 1;
  return response(request.url);
};

const context = {
  self,
  URL,
  Request,
  Headers,
  Response,
  fetch: request => fetchImpl(request),
  caches,
};
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8'),
  context,
  { filename: 'sw.js' }
);

const CACHE = vm.runInContext('CACHE', context);
const CACHE_GENERATION_MATCH = /^grifflist-livekit-offline-v([0-9]+)$/.exec(CACHE);
assert.ok(CACHE_GENERATION_MATCH, 'service-worker cache must use the versioned Grifflist cache name');
const CACHE_GENERATION = Number(CACHE_GENERATION_MATCH[1]);
assert.ok(CACHE_GENERATION >= 2, 'rollback coverage requires at least two cache generations');
const cacheNameForGeneration = generation => `grifflist-livekit-offline-v${generation}`;
const PREVIOUS_CACHE = cacheNameForGeneration(CACHE_GENERATION - 1);
const OLDER_CACHE = cacheNameForGeneration(CACHE_GENERATION - 2);
const CORE = vm.runInContext('CORE.slice()', context);
const PRECACHE_CONCURRENCY = vm.runInContext('PRECACHE_CONCURRENCY', context);
let passed = 0;

function reset() {
  cacheData = new Map();
  failCacheMatch = false;
  failCacheOpen = false;
  failCachePut = false;
  failCacheDeleteFor = new Set();
  fetchCalls = 0;
  fetchedRequests = [];
  activeFetches = 0;
  peakActiveFetches = 0;
  skipWaitingCalls = 0;
  claimCalls = 0;
  fetchImpl = async request => {
    fetchCalls += 1;
    fetchedRequests.push(request);
    return response(request.url);
  };
}

async function dispatch(name, event = {}) {
  const waits = [];
  const handler = listeners.get(name);
  assert.equal(typeof handler, 'function', 'missing ' + name + ' event handler');
  handler({
    ...event,
    waitUntil(promise) {
      waits.push(Promise.resolve(promise));
    },
  });
  await Promise.all(waits);
}

function navigation(url, {
  cache = 'default',
  credentials = 'omit',
  headers = new Headers(),
} = {}) {
  return {
    url,
    method: 'GET',
    headers,
    mode: 'navigate',
    destination: 'document',
    credentials,
    cache,
  };
}

async function dispatchFetch(request) {
  let responsePromise;
  let waitPromise;
  listeners.get('fetch')({
    request,
    waitUntil(promise) {
      waitPromise = Promise.resolve(promise);
    },
    respondWith(promise) {
      responsePromise = Promise.resolve(promise);
    },
  });
  return { responsePromise, waitPromise };
}

async function test(name, callback) {
  await callback();
  passed += 1;
  process.stdout.write('PASS ' + name + '\n');
}

(async () => {
  await test('install caches exactly the public CORE shell with credentialless requests', async () => {
    reset();
    await dispatch('install');
    const entries = cacheData.get(CACHE);
    assert.ok(entries);
    assert.equal(entries.size, CORE.length);
    assert.equal(fetchedRequests.length, CORE.length);
    assert.ok(fetchedRequests.every(request =>
      request.credentials === 'omit' && request.cache === 'reload'
    ));
    assert.equal(skipWaitingCalls, 1);
    for (const url of entries.keys()) {
      const pathname = new URL(url).pathname;
      assert.equal(
        vm.runInContext('isPrivatePath(' + JSON.stringify(pathname) + ')', context),
        false,
        pathname
      );
      assert.equal(
        vm.runInContext('isApiPath(' + JSON.stringify(pathname) + ')', context),
        false,
        pathname
      );
    }
  });

  await test('install refuses redirected private-boundary responses and does not skip waiting', async () => {
    reset();
    fetchImpl = async request => {
      fetchCalls += 1;
      return response(request.url, { redirected: request.url.endsWith('/offline.html') });
    };
    await assert.rejects(dispatch('install'), /Refusing to precache/);
    assert.equal(skipWaitingCalls, 0);
  });

  await test('install bounds concurrent precache fetches', async () => {
    reset();
    fetchImpl = async request => {
      fetchCalls += 1;
      fetchedRequests.push(request);
      activeFetches += 1;
      peakActiveFetches = Math.max(peakActiveFetches, activeFetches);
      try {
        await Promise.resolve();
        return response(request.url);
      } finally {
        activeFetches -= 1;
      }
    };

    await dispatch('install');
    assert.equal(fetchedRequests.length, CORE.length);
    assert.ok(peakActiveFetches <= PRECACHE_CONCURRENCY);
    assert.equal(peakActiveFetches, PRECACHE_CONCURRENCY);
    assert.equal(cacheData.get(CACHE).size, CORE.length);
    assert.equal(skipWaitingCalls, 1);
  });

  await test('failed install preserves the previous active cache generation', async () => {
    reset();
    const previousCache = PREVIOUS_CACHE;
    assert.notEqual(CACHE, previousCache);
    cacheData.set(previousCache, new Map([['sentinel', response(ORIGIN + '/index.html')]]));

    fetchImpl = async request => {
      fetchCalls += 1;
      fetchedRequests.push(request);
      if (request.url.endsWith('/offline.html')) {
        throw new Error('simulated offline shell fetch failure');
      }
      return response(request.url);
    };

    await assert.rejects(dispatch('install'), /simulated offline shell fetch failure/);
    assert.equal(cacheData.has(CACHE), false, 'failed install removes only the new cache generation');
    assert.equal(cacheData.get(previousCache).has('sentinel'), true);
    assert.equal(skipWaitingCalls, 0);
  });

  await test('CacheStorage open failure during install preserves the previous active cache generation', async () => {
    reset();
    const previousCache = PREVIOUS_CACHE;
    assert.notEqual(CACHE, previousCache);
    cacheData.set(previousCache, new Map([['sentinel', response(ORIGIN + '/index.html')]]));
    failCacheOpen = true;

    await assert.rejects(dispatch('install'), /simulated CacheStorage\.open failure/);
    assert.equal(cacheData.has(CACHE), false);
    assert.equal(cacheData.get(previousCache).has('sentinel'), true);
    assert.equal(skipWaitingCalls, 0);
  });

  await test('install drains only in-flight precache tasks and removes partial cache after failure', async () => {
    reset();
    let releaseDelayed;
    const delayed = new Promise(resolve => { releaseDelayed = resolve; });
    let signalDelayedStarted;
    const delayedStarted = new Promise(resolve => { signalDelayedStarted = resolve; });
    let signalFailure;
    const failureSeen = new Promise(resolve => { signalFailure = resolve; });

    fetchImpl = async request => {
      fetchCalls += 1;
      fetchedRequests.push(request);
      activeFetches += 1;
      peakActiveFetches = Math.max(peakActiveFetches, activeFetches);
      try {
        if (request.url.endsWith('/offline.html')) {
          signalFailure();
          throw new Error('simulated offline shell fetch failure');
        }
        if (request.url.endsWith('/roadmap.html')) {
          signalDelayedStarted();
          await delayed;
        } else {
          await Promise.resolve();
        }
        return response(request.url);
      } finally {
        activeFetches -= 1;
      }
    };

    const installPromise = dispatch('install');
    await Promise.all([delayedStarted, failureSeen]);
    let settled = false;
    installPromise.then(
      () => { settled = true; },
      () => { settled = true; }
    );
    await Promise.resolve();
    assert.equal(settled, false, 'install must wait for every already-started precache task');
    assert.ok(peakActiveFetches <= PRECACHE_CONCURRENCY);

    releaseDelayed();
    await assert.rejects(installPromise, /simulated offline shell fetch failure/);
    assert.ok(fetchedRequests.length < CORE.length, 'failed installation must stop scheduling new assets');
    assert.equal(cacheData.has(CACHE), false, 'failed installation must remove its partial cache');
    assert.equal(skipWaitingCalls, 0);
  });
  await test('activate deletes only obsolete Grifflist cache generations', async () => {
    reset();
    cacheData.set('grifflist-livekit-offline-v53', new Map());
    cacheData.set('grifflist-livekit-offline-v54', new Map());
    cacheData.set('grifflist-livekit-offline-v55', new Map());
    cacheData.set('grifflist-livekit-offline-v56', new Map());
    cacheData.set('grifflist-livekit-offline-v57', new Map());
    // v58 may contain config aliases cached before the private-path fix.
    cacheData.set('grifflist-livekit-offline-v58', new Map());
    cacheData.set(PREVIOUS_CACHE, new Map());
    cacheData.set(OLDER_CACHE, new Map());
    cacheData.set('grifflist-sober-drive-search-fix-offline-v7', new Map());
    cacheData.set(CACHE, new Map());
    cacheData.set('unrelated-public-cache', new Map());
    await dispatch('activate');
    assert.deepEqual(
      [...cacheData.keys()].sort(),
      [CACHE, 'unrelated-public-cache'].sort()
    );
    assert.equal(claimCalls, 1);
  });

  await test('activate preserves the previous cache when an older cache deletion fails', async () => {
    reset();
    const olderCache = OLDER_CACHE;
    const previousCache = PREVIOUS_CACHE;
    cacheData.set(olderCache, new Map());
    cacheData.set(previousCache, new Map());
    cacheData.set(CACHE, new Map());
    failCacheDeleteFor.add(olderCache);

    await assert.rejects(dispatch('activate'), /simulated CacheStorage\.delete failure/);
    assert.equal(cacheData.has(olderCache), true);
    assert.equal(cacheData.has(previousCache), true);
    assert.equal(cacheData.has(CACHE), true);
    assert.equal(claimCalls, 0);
  });

  await test('activate does not claim clients when obsolete cache deletion fails', async () => {
    reset();
    const obsoleteCache = PREVIOUS_CACHE;
    cacheData.set(obsoleteCache, new Map());
    cacheData.set(CACHE, new Map());
    failCacheDeleteFor.add(obsoleteCache);

    await assert.rejects(dispatch('activate'), /simulated CacheStorage\.delete failure/);
    assert.equal(cacheData.has(obsoleteCache), true);
    assert.equal(cacheData.has(CACHE), true);
    assert.equal(claimCalls, 0);
  });

  await test('private admin requests bypass fetch handling and CacheStorage entirely', async () => {
    reset();
    const before = fetchCalls;
    let waitCount = 0;
    let respondCount = 0;
    listeners.get('fetch')({
      request: navigation(ORIGIN + '/admin.html'),
      waitUntil() { waitCount += 1; },
      respondWith() { respondCount += 1; },
    });
    assert.equal(fetchCalls, before);
    assert.equal(waitCount, 0);
    assert.equal(respondCount, 0);
    assert.equal(cacheData.has(CACHE), false);
  });

  await test('Supabase config suffix and descendant aliases bypass fetch handling and CacheStorage', async () => {
    for (const pathname of [
      '/supabase-config.js.map',
      '/supabase-config.js/extra',
      '/%73upabase-config.js.map',
      '/%2573upabase-config.js.map',
    ]) {
      reset();
      const before = fetchCalls;
      let waitCount = 0;
      let respondCount = 0;
      listeners.get('fetch')({
        request: {
          url: ORIGIN + pathname,
          method: 'GET',
          headers: new Headers(),
          mode: 'cors',
          destination: 'script',
          credentials: 'same-origin',
        },
        waitUntil() { waitCount += 1; },
        respondWith() { respondCount += 1; },
      });
      assert.equal(fetchCalls, before, pathname);
      assert.equal(waitCount, 0, pathname);
      assert.equal(respondCount, 0, pathname);
      assert.equal(cacheData.has(CACHE), false, pathname);
    }
  });

  await test('explicit cache-bypass requests skip the service-worker cache handler', async () => {
    reset();
    const url = ORIGIN + '/styles.css';
    const cases = [
      { cache: 'no-store' },
      { cache: 'no-cache' },
      { headerValues: { 'Cache-Control': 'no-store' } },
      { headerValues: { 'Cache-Control': 'no-cache' } },
      { headerValues: { 'Cache-Control': 'max-age=0' } },
      { headerValues: { 'Cache-Control': 'max-age=00' } },
      { headerValues: { 'Cache-Control': 'no-cache="set-cookie"' } },
      { headerValues: { Pragma: 'no-cache' } },
    ];
    for (const item of cases) {
      const request = {
        url,
        method: 'GET',
        headers: new Headers(item.headerValues || {}),
        mode: 'cors',
        destination: 'style',
        credentials: 'omit',
        cache: item.cache || 'default',
      };
      const beforeFetch = fetchCalls;
      const result = await dispatchFetch(request);
      assert.equal(result.responsePromise, undefined, JSON.stringify(item));
      assert.equal(result.waitPromise, undefined, JSON.stringify(item));
      assert.equal(fetchCalls, beforeFetch, JSON.stringify(item));
      assert.equal(cacheData.has(CACHE), false, JSON.stringify(item));
    }
  });

  await test('public reload navigation is intercepted but max-age=0 responses are not persisted', async () => {
    reset();
    await dispatch('install');
    const url = ORIGIN + '/index.html';
    const cached = cacheData.get(CACHE).get(url);
    fetchImpl = async request => {
      fetchCalls += 1;
      fetchedRequests.push(request);
      return response(request.url, { cacheControl: 'public, max-age=7200' });
    };
    const result = await dispatchFetch(navigation(url, {
      cache: 'reload',
      credentials: 'same-origin',
      headers: new Headers({ 'Cache-Control': 'max-age=0' }),
    }));
    assert.ok(result.responsePromise, 'public reload navigation must reach the service-worker handler');
    const fresh = await result.responsePromise;
    await result.waitPromise;
    assert.equal(fresh.headers.get('Cache-Control'), 'public, max-age=7200');
    assert.equal(
      cacheData.get(CACHE).get(url).headers.get('Cache-Control'),
      cached.headers.get('Cache-Control'),
      'a revalidation response must not replace the precached public shell',
    );
  });

  await test('runtime navigation does not cache a private final response URL', async () => {
    reset();
    const requestedUrl = ORIGIN + '/index.html';
    const privateFinalUrl = ORIGIN + '/admin.html';
    fetchImpl = async request => {
      fetchCalls += 1;
      fetchedRequests.push(request);
      return response(privateFinalUrl);
    };

    const result = await dispatchFetch(navigation(requestedUrl));
    const fresh = await result.responsePromise;
    await result.waitPromise;

    // The online response is still delivered, but a private final URL must
    // never be persisted under an otherwise-public request URL.
    assert.equal(fresh.url, privateFinalUrl);
    assert.equal(cacheData.get(CACHE).has(requestedUrl), false);
  });

  await test('CacheStorage read failures do not block online public navigation', async () => {
    reset();
    failCacheMatch = true;
    const url = ORIGIN + '/index.html';
    const result = await dispatchFetch(navigation(url));
    const fresh = await result.responsePromise;
    await result.waitPromise;
    assert.equal(fresh.url, url);
    assert.equal(fetchCalls, 1);
  });

  await test('CacheStorage read failures fail closed only when the network is also unavailable', async () => {
    reset();
    failCacheMatch = true;
    fetchImpl = async () => {
      fetchCalls += 1;
      throw new Error('simulated offline network');
    };
    const result = await dispatchFetch(navigation(ORIGIN + '/index.html'));
    const failed = await result.responsePromise;
    await result.waitPromise;
    assert.equal(failed.type, 'error');
    assert.equal(fetchCalls, 1);
  });

  await test('CacheStorage open failures do not block online public navigation', async () => {
    reset();
    failCacheOpen = true;
    const url = ORIGIN + '/index.html';
    const result = await dispatchFetch(navigation(url));
    const fresh = await result.responsePromise;
    await result.waitPromise;
    assert.equal(fresh.url, url);
    assert.equal(fetchCalls, 1);
    assert.equal(cacheData.has(CACHE), false);
  });

  await test('CacheStorage put failures do not block online public navigation', async () => {
    reset();
    failCachePut = true;
    const url = ORIGIN + '/index.html';
    const result = await dispatchFetch(navigation(url));
    const fresh = await result.responsePromise;
    await result.waitPromise;
    assert.equal(fresh.url, url);
    assert.equal(fetchCalls, 1);
    assert.equal(cacheData.get(CACHE).has(url), false);
  });

  await test('CacheStorage open and network failures return an error response without throwing', async () => {
    reset();
    failCacheOpen = true;
    fetchImpl = async () => {
      fetchCalls += 1;
      throw new Error('simulated offline network');
    };
    const result = await dispatchFetch(navigation(ORIGIN + '/index.html'));
    const failed = await result.responsePromise;
    await result.waitPromise;
    assert.equal(failed.type, 'error');
    assert.equal(fetchCalls, 1);
  });

  await test('public navigation caches credentialless network responses and falls back offline', async () => {
    reset();
    const url = ORIGIN + '/index.html';
    const first = await dispatchFetch(navigation(url));
    assert.ok(first.responsePromise);
    const fresh = await first.responsePromise;
    await first.waitPromise;
    assert.equal(fresh.url, url);
    assert.equal(cacheData.get(CACHE).has(url), true);

    fetchImpl = async () => {
      fetchCalls += 1;
      throw new Error('simulated offline network');
    };
    const second = await dispatchFetch(navigation(url));
    const cached = await second.responsePromise;
    await second.waitPromise;
    assert.equal(cached.url, url);
    assert.equal(fetchCalls, 2);
  });

  await test('same-origin reload navigation uses the precached public shell offline without persisting credentialed network responses', async () => {
    reset();
    const url = ORIGIN + '/index.html';

    // Install-time CORE requests are explicitly credentialless. A normal
    // browser navigation, however, uses same-origin credentials by default.
    await dispatch('install');
    // Exclude the install-time CORE fetches from the two runtime requests below.
    fetchCalls = 0;
    const precached = cacheData.get(CACHE).get(url);
    assert.ok(precached, 'the public homepage must exist in the credentialless offline shell');

    fetchImpl = async request => {
      fetchCalls += 1;
      return response(request.url);
    };
    const online = await dispatchFetch({
      ...navigation(url),
      credentials: 'same-origin',
    });
    const fresh = await online.responsePromise;
    await online.waitPromise;

    assert.equal(fresh.url, url);
    assert.notEqual(fresh, precached, 'online navigation should prefer the fresh network response');
    assert.equal(
      cacheData.get(CACHE).get(url),
      precached,
      'a credentialed same-origin response must not overwrite the credentialless precache entry',
    );

    fetchImpl = async () => {
      fetchCalls += 1;
      throw new Error('simulated offline network');
    };
    const offline = await dispatchFetch(navigation(url, {
      cache: 'reload',
      credentials: 'same-origin',
      headers: new Headers({ 'Cache-Control': 'max-age=0' }),
    }));
    const cached = await offline.responsePromise;
    await offline.waitPromise;

    assert.equal(cached, precached, 'the credentialless public shell remains available offline');
    assert.equal(fetchCalls, 2);
  });

  process.stdout.write('PASS ' + passed + ' service-worker lifecycle groups\n');
})().catch(error => {
  process.stderr.write(String(error && error.stack || error) + '\n');
  process.exitCode = 1;
});
