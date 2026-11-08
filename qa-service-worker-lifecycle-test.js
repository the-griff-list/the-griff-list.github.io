#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ORIGIN = 'https://griff-list.test';
const listeners = new Map();
let cacheData = new Map();
let fetchImpl;
let fetchCalls = 0;
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
    if (!cacheData.has(name)) cacheData.set(name, new Map());
    const entries = cacheData.get(name);
    return {
      async put(request, value) {
        entries.set(cacheKey(request), value);
      },
      async match(request) {
        return entries.get(cacheKey(request)) || null;
      },
    };
  },
  async keys() {
    return [...cacheData.keys()];
  },
  async delete(name) {
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
const CORE = vm.runInContext('CORE.slice()', context);
let passed = 0;

function reset() {
  cacheData = new Map();
  fetchCalls = 0;
  skipWaitingCalls = 0;
  claimCalls = 0;
  fetchImpl = async request => {
    fetchCalls += 1;
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

function navigation(url) {
  return {
    url,
    method: 'GET',
    headers: new Headers(),
    mode: 'navigate',
    destination: 'document',
    credentials: 'omit',
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

  await test('activate deletes only obsolete Grifflist cache generations', async () => {
    reset();
    cacheData.set('grifflist-livekit-offline-v53', new Map());
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

  process.stdout.write('PASS ' + passed + ' service-worker lifecycle groups\n');
})().catch(error => {
  process.stderr.write(String(error && error.stack || error) + '\n');
  process.exitCode = 1;
});
