#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ORIGIN = 'https://griff-list.test';
const source = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
const listeners = new Map();
const self = {
  location: { origin: ORIGIN },
  registration: { scope: ORIGIN + '/' },
  addEventListener(name, callback) { listeners.set(name, callback); },
  skipWaiting() { return Promise.resolve(); },
  clients: { claim() { return Promise.resolve(); } },
};
const context = { self, URL, Request, Response, Headers, fetch, caches: { open() {} } };
vm.createContext(context);
vm.runInContext(source, context, { filename: 'sw.js' });

function headers(values = {}) {
  const normalized = new Map(
    Object.entries(values).map(([key, value]) => [key.toLowerCase(), String(value)])
  );
  return {
    has(name) { return normalized.has(name.toLowerCase()); },
    get(name) { return normalized.get(name.toLowerCase()) ?? null; },
  };
}

function request({
  method = 'GET',
  headerValues = {},
  mode = 'cors',
  destination = '',
  credentials = 'omit',
  cache = 'default',
} = {}) {
  return { method, headers: headers(headerValues), mode, destination, credentials, cache };
}

function response({
  status = 200,
  ok = status >= 200 && status < 300,
  type = 'basic',
  url = ORIGIN + '/styles.css',
  redirected = false,
  headerValues = {},
} = {}) {
  return { status, ok, type, url, redirected, headers: headers(headerValues) };
}

let passed = 0;
function test(name, callback) {
  callback();
  passed += 1;
  process.stdout.write('PASS ' + name + '\n');
}

test('explicit private assets and private section prefixes are denied', () => {
  for (const pathname of [
    '/admin.html', '/admin.js', '/admin-features.js',
    '/analytics.html', '/analytics-dashboard.js', '/analytics-tracker.js',
    '/request-archive.html', '/request-archive.js', '/supabase-config.js',
    '/supabase-config.js.map', '/supabase-config.js/extra',
    '/%73upabase-config.js.map', '/%2573upabase-config.js.map',
    '/admin/users', '/analytics/reports', '/request-archive/export',
  ]) {
    assert.equal(context.isPrivatePath(pathname), true, pathname);
  }
  assert.equal(context.isPrivatePath('/explore.html'), false);
});

test('case and repeated percent decoding cannot bypass private-path checks', () => {
  for (const pathname of [
    '/ADMIN.HTML', '/%61dmin.html', '/%2561dmin.html',
    '/%252561dmin.html', '/x/%2e%2e/admin.html',
    '/public%5c..%5cadmin.html',
  ]) {
    assert.equal(context.isPrivatePath(pathname), true, pathname);
  }
});

test('malformed, control-bearing, traversal and over-encoded paths fail closed', () => {
  for (const pathname of [
    '/%ZZ', '/admin%00.html', '/safe/../public.js',
    '/%252525252525252fadmin.html',
  ]) {
    assert.equal(context.isPrivatePath(pathname), true, pathname);
    assert.equal(context.isApiPath(pathname), true, pathname);
  }
});

test('Supabase and application API prefixes are denied after decoding', () => {
  for (const pathname of [
    '/rest/v1/song_requests', '/auth/v1/token', '/functions/v1/edge',
    '/storage/v1/object', '/graphql/v1', '/realtime/v1/websocket',
    '/api/private', '/x/%72est%2fv1%2fusers',
  ]) {
    assert.equal(context.isApiPath(pathname), true, pathname);
  }
  assert.equal(context.isApiPath('/roadmap.html'), false);
});

test('request eligibility permits only public navigation and approved static assets', () => {
  assert.equal(
    context.isCacheableRequest(request({ mode: 'navigate' }), new URL('/index.html', ORIGIN)),
    true
  );
  assert.equal(
    context.isCacheableRequest(request({ mode: 'navigate' }), new URL('/index.html?preview=1', ORIGIN)),
    false
  );
  assert.equal(
    context.isCacheableRequest(request({ destination: 'style' }), new URL('/styles.css', ORIGIN)),
    true
  );
  assert.equal(
    context.isCacheableRequest(request({ destination: 'style' }), new URL('/styles.css?v=grifflist-v41', ORIGIN)),
    true
  );
  assert.equal(
    context.isCacheableRequest(request({ destination: 'style' }), new URL('/styles.css?v=unreviewed', ORIGIN)),
    false
  );
});

test('explicit no-store/no-cache requests bypass while reload navigation remains interceptable', () => {
  const publicUrl = new URL('/styles.css', ORIGIN);
  for (const cache of ['no-store', 'no-cache']) {
    assert.equal(context.isCacheableRequest(request({ destination: 'style', cache }), publicUrl), false, cache);
  }
  assert.equal(
    context.isCacheableRequest(
      request({
        mode: 'navigate',
        destination: 'document',
        cache: 'reload',
        headerValues: { 'Cache-Control': 'max-age=0' },
      }),
      new URL('/index.html', ORIGIN),
    ),
    true,
    'browser reload navigation must remain interceptable for offline fallback',
  );
  assert.equal(
    context.isCacheableRequest(
      request({
        mode: 'navigate',
        destination: 'document',
        cache: 'reload',
        headerValues: { 'Cache-Control': 'no-store' },
      }),
      new URL('/index.html', ORIGIN),
    ),
    false,
    'explicit no-store must still bypass the service-worker cache',
  );
  for (const cacheControl of ['no-store', 'no-cache', 'no-store=1', 'no-cache="set-cookie"', 'max-age=0', 'max-age=00', 'public, max-age="0"']) {
    assert.equal(
      context.isCacheableRequest(
        request({ destination: 'style', headerValues: { 'Cache-Control': cacheControl } }),
        publicUrl
      ),
      false,
      cacheControl
    );
  }
  assert.equal(
    context.isCacheableRequest(
      request({ destination: 'style', headerValues: { Pragma: 'no-cache' } }),
      publicUrl
    ),
    false
  );
  assert.equal(context.isCacheableRequest(request({ destination: 'style' }), publicUrl), true);
});

test('request eligibility rejects methods, ranges, credentials, private paths, APIs and other origins', () => {
  const publicUrl = new URL('/styles.css', ORIGIN);
  assert.equal(context.isCacheableRequest(request({ method: 'HEAD', destination: 'style' }), publicUrl), false);
  assert.equal(context.isCacheableRequest(request({ method: 'POST', destination: 'style' }), publicUrl), false);
  assert.equal(context.isCacheableRequest(request({ destination: 'style', headerValues: { Range: 'bytes=0-10' } }), publicUrl), false);
  assert.equal(context.isCacheableRequest(request({ destination: 'style', headerValues: { Authorization: 'Bearer x' } }), publicUrl), false);
  assert.equal(context.isCacheableRequest(request({ mode: 'navigate' }), new URL('/admin.html', ORIGIN)), false);
  assert.equal(context.isCacheableRequest(request({ mode: 'navigate' }), new URL('/rest/v1/users', ORIGIN)), false);
  assert.equal(context.isCacheableRequest(request({ destination: 'style' }), new URL('/styles.css', 'https://other.test')), false);
});

test('response URL checks reject redirects, cross-origin targets, private and API final URLs', () => {
  assert.equal(context.isSafePublicCacheResponse(response(), ORIGIN + '/styles.css', ORIGIN), true);
  assert.equal(context.isSafePublicCacheResponse(response({ redirected: true }), ORIGIN + '/styles.css', ORIGIN), false);
  assert.equal(context.isSafePublicCacheResponse(response({ url: 'https://other.test/styles.css' }), ORIGIN + '/styles.css', ORIGIN), false);
  assert.equal(context.isSafePublicCacheResponse(response({ url: ORIGIN + '/admin.html' }), ORIGIN + '/styles.css', ORIGIN), false);
  assert.equal(context.isSafePublicCacheResponse(response({ url: ORIGIN + '/rest/v1/users' }), ORIGIN + '/styles.css', ORIGIN), false);
  assert.equal(context.isSafePublicCacheResponse(response(), 'https://other.test/styles.css', ORIGIN), false);
});

test('response URL checks reject repeatedly encoded private and API paths', () => {
  const publicRequest = ORIGIN + '/index.html';
  const publicResponse = response({ url: ORIGIN + '/explore.html' });
  const blockedPaths = [
    '/%2561dmin.html',
    '/public/%252e%252e/admin.html',
    '/%2572est/v1/users',
    '/public/%252e%252e/api/private',
    '/%252fadmin.html',
  ];

  for (const pathname of blockedPaths) {
    assert.equal(
      context.isSafePublicCacheResponse(
        response({ url: ORIGIN + pathname }),
        publicRequest,
        ORIGIN
      ),
      false,
      'private/API final response URL: ' + pathname
    );
    assert.equal(
      context.isSafePublicCacheResponse(publicResponse, ORIGIN + pathname, ORIGIN),
      false,
      'private/API requested URL: ' + pathname
    );
  }
});

test('response cache policy rejects freshness, privacy, range and vary hazards', () => {
  assert.equal(context.isCacheableResponse(response({ headerValues: { 'Cache-Control': 'public, max-age=3600' } })), true);
  for (const value of [
    'no-store', 'no-cache', 'private', 'must-revalidate',
    'proxy-revalidate', 'max-age=0', 's-maxage=0', 'max-age="0"',
  ]) {
    assert.equal(context.isCacheableResponse(response({ headerValues: { 'Cache-Control': value } })), false, value);
  }
  assert.equal(context.isCacheableResponse(response({ headerValues: { Pragma: 'no-cache' } })), false);
  for (const value of ['*', 'Cookie', 'Authorization']) {
    assert.equal(context.isCacheableResponse(response({ headerValues: { Vary: value } })), false, value);
  }
  assert.equal(context.isCacheableResponse(response({ status: 206 })), false);
  assert.equal(context.isCacheableResponse(response({ type: 'opaque' })), false);
});

test('only credentialless requests without authorization may persist responses', () => {
  const safe = response();
  assert.equal(context.isCacheableResponseForRequest(request({ credentials: 'omit' }), safe), true);
  assert.equal(context.isCacheableResponseForRequest(request({ credentials: 'same-origin' }), safe), false);
  assert.equal(context.isCacheableResponseForRequest(request({ credentials: 'include' }), safe), false);
  assert.equal(
    context.isCacheableResponseForRequest(
      request({ credentials: 'omit', headerValues: { Authorization: 'Bearer x' } }),
      safe
    ),
    false
  );
});

process.stdout.write('PASS ' + passed + ' service-worker policy groups\n');
