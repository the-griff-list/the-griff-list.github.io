const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const vm = require('node:vm');

const serviceWorkerSource = fs.readFileSync(`${__dirname}/sw.js`, 'utf8');
const cacheNameMatches = [...serviceWorkerSource.matchAll(/^const CACHE = '([^']+)';$/gm)];
if (cacheNameMatches.length !== 1) {
  throw new Error('Could not identify exactly one production service-worker cache name.');
}
const serviceWorkerCacheName = cacheNameMatches[0][1];
const cachePolicyMatch = serviceWorkerSource.match(
  /function isCacheableResponse\(response\) \{[\s\S]*?\n\}/,
);
const cacheRequestGuardMatch = serviceWorkerSource.match(
  /function hasExplicitNoStoreOrNoCache\(request\) \{[\s\S]*?\n\}/,
);
const cacheRequestPolicyMatch = serviceWorkerSource.match(
  /function isCacheableResponseForRequest\(request, response\) \{[\s\S]*?\n\}/,
);
if (!cachePolicyMatch || !cacheRequestGuardMatch || !cacheRequestPolicyMatch) {
  throw new Error('Could not extract the production service-worker cache policies.');
}
const cachePolicyContext = {};
vm.runInNewContext(
  `${cachePolicyMatch[0]}\n${cacheRequestGuardMatch[0]}\n${cacheRequestPolicyMatch[0]}\nglobalThis.isCacheableResponse = isCacheableResponse;\nglobalThis.isCacheableResponseForRequest = isCacheableResponseForRequest;`,
  cachePolicyContext,
);

test('service worker refuses responses that require HTTP revalidation before reuse', async () => {
  const isCacheable = cachePolicyContext.isCacheableResponse;
  const response = ({ cacheControl = '', pragma = '', vary = '', ok = true, type = 'basic', status = 200 } = {}) => ({
    ok,
    type,
    status,
    headers: {
      get(name) {
        return ({
          'Cache-Control': cacheControl,
          Pragma: pragma,
          Vary: vary,
        })[name] || null;
      },
    },
  });

  expect(isCacheable(response({ cacheControl: 'public, max-age=3600' }))).toBe(true);
  for (const cacheControl of [
    'no-cache',
    'no-cache="Set-Cookie"',
    'must-revalidate',
    'proxy-revalidate',
    'private',
    'no-store',
    'max-age=0',
    'max-age="0"',
    's-maxage=0',
    'public, max-age=000',
  ]) {
    expect(isCacheable(response({ cacheControl })), cacheControl).toBe(false);
  }
  expect(isCacheable(response({ pragma: 'no-cache' }))).toBe(false);
  expect(isCacheable(response({ vary: 'Accept-Language, Cookie' }))).toBe(false);
  expect(isCacheable(response({ vary: 'Authorization' }))).toBe(false);
  expect(isCacheable(response({ vary: '*' }))).toBe(false);
  expect(isCacheable(response({ vary: 'Accept-Language' }))).toBe(true);
  expect(isCacheable(response({ ok: false }))).toBe(false);
  expect(isCacheable(response({ type: 'cors' }))).toBe(false);
  expect(isCacheable(response({ status: 204 }))).toBe(false);
  expect(isCacheable(response({ status: 206 }))).toBe(false);
});


test('service worker only stores responses fetched without credentials', () => {
  const canStore = cachePolicyContext.isCacheableResponseForRequest;
  const response = { ok: true, type: 'basic', status: 200, headers: { get: () => null } };
  const request = (credentials, authorization = false) => ({
    credentials,
    headers: { get: () => null, has: name => name === 'Authorization' && authorization },
  });

  expect(canStore(request('omit'), response)).toBe(true);
  expect(canStore(request('same-origin'), response)).toBe(false);
  expect(canStore(request('include'), response)).toBe(false);
  expect(canStore(request('omit', true), response)).toBe(false);
  expect(canStore(request('omit'), {
    ...response,
    headers: { get: name => name === 'Cache-Control' ? 'private' : null },
  })).toBe(false);
});
test('offline shell precache and runtime share the fail-closed response policy', () => {
  expect(serviceWorkerSource).not.toContain('cache.addAll(');
  expect(
    serviceWorkerSource.match(/isSafePublicCacheResponse\(response, request\.url, self\.location\.origin\)/g),
  ).toHaveLength(2);
  expect(serviceWorkerSource).toContain('if (!isCacheableResponseForRequest(request, response) ||');
  expect(serviceWorkerSource).toContain('if (isCacheableResponseForRequest(request, response) &&');
  expect(serviceWorkerSource).toContain("credentials: 'omit'");
  expect(serviceWorkerSource).toContain("request.headers.has('Range')");
  expect(serviceWorkerSource).toContain('response.status === 200');
  expect(serviceWorkerSource).toContain('if (!isCacheableResponseForRequest(request, response) ||');
  expect(serviceWorkerSource).toContain('await cache.put(request, response)');
});

test('service worker fails closed on encoded private and API paths', async () => {
  const pathPolicyStart = serviceWorkerSource.indexOf('const CORE = [');
  const pathPolicyEnd = serviceWorkerSource.indexOf('function isCacheableResponse(', pathPolicyStart);
  if (pathPolicyStart < 0 || pathPolicyEnd < 0) {
    throw new Error('Could not extract the production service-worker path policy.');
  }
  const pathPolicyContext = {
    URL,
    self: {
      registration: { scope: 'https://site.invalid/' },
      location: { origin: 'https://site.invalid' },
    },
  };
  vm.runInNewContext(
    `${serviceWorkerSource.slice(pathPolicyStart, pathPolicyEnd)}
globalThis.isPrivatePath = isPrivatePath;
globalThis.isApiPath = isApiPath;
globalThis.isSafePublicCacheResponse = isSafePublicCacheResponse;`,
    pathPolicyContext,
  );

  const isPrivatePath = pathPolicyContext.isPrivatePath;
  const isApiPath = pathPolicyContext.isApiPath;
  const isSafePublicCacheResponse = pathPolicyContext.isSafePublicCacheResponse;
  const publicOrigin = 'https://site.invalid';
  const publicRequest = 'https://site.invalid/explore.html';
  const safeResponse = (url, redirected = false) => ({ url, redirected });
  expect(isSafePublicCacheResponse(safeResponse(publicRequest), publicRequest, publicOrigin)).toBe(true);
  for (const [url, redirected, request] of [
    ['https://site.invalid/admin.html', true, publicRequest],
    ['https://site.invalid/admin.html', false, publicRequest],
    ['https://site.invalid/rest/v1/song_requests', false, publicRequest],
    ['https://external.invalid/explore.html', false, publicRequest],
    ['not a URL', false, publicRequest],
    ['https://site.invalid/explore.html', false, 'https://site.invalid/admin.html'],
    ['https://site.invalid/explore.html', false, 'https://site.invalid/rest/v1/private'],
  ]) {
    expect(isSafePublicCacheResponse(safeResponse(url, redirected), request, publicOrigin)).toBe(false);
  }

  for (const pathname of [
    '/%61dmin.js',
    '/%2561dmin.js',
    '/%2fadmin.html',
    '/%5cadmin.js',
    '/%252e%252e/admin.html',
    '/public/%252e%252e/admin.html',
    '/nested/%252e%252e/%252e%252e/admin.js',
    '/public/%252e%252e/analytics.html',
    '/public/%252e%252e/request-archive.html',
    '/admin/%252e%252e/index.html',
    '/public/%252e%252e/index.html',
    '/nested/%252e%252e/%252e%252e/index.html',
    '/%61nalytics-dashboard.js',
    '/%72equest-archive.js',
    '/supabase-config%2ejs',
    '/%00admin.html',
    '/%0aadmin.js',
    '/%7frequest-archive.html',
    '/%2500admin.html',
    '/%250aadmin.js',
    // Exercise the four-pass decoding ceiling, encoded separators/backslashes,
    // and case-folded private prefixes. Ambiguous paths must fail closed.
    '/public/%252525252e%252525252e/admin.html',
    '/public/%255c..%255cadmin.js',
    '/AdMiN.html',
    '/public/%25252525252e%25252525252e/request-archive.js',
    '/public/%252525252f..%252525252fanalytics.html',
  ]) {
    expect(isPrivatePath(pathname), pathname).toBe(true);
  }
  for (const pathname of [
    '/%72est/v1/song_requests',
    '/%61uth/v1/token',
    '/%66unctions/v1/foo',
    '/%73torage/v1/object',
    '/%67raphql/v1',
    '/%72ealtime/v1/websocket',
    '/%61pi/private',
    '/%252e%252e/rest/v1/song_requests',
    '/public/%252e%252e/api/private',
    '/rest/v1/%252e%252e/index.html',
    '/public/%252e%252e/rest/v1/song_requests',
    '/nested/%252e%252e/api/private',
    '/graphql/v1',
    '/%00rest/v1/song_requests',
    '/%0aauth/v1/token',
    '/%7fapi/private',
    '/%2500rest/v1/song_requests',
    '/%250aauth/v1/token',
    '/public/%252525252e%252525252e/rest/v1/song_requests',
    '/public/%255c..%255capi/private',
    '/public/%25252525252e%25252525252e/auth/v1/token',
  ]) {
    expect(isApiPath(pathname), pathname).toBe(true);
  }

  // Public assets containing ordinary encoded spaces must remain cache-eligible.
  expect(isPrivatePath('/Title%20screen.mp3')).toBe(false);
  expect(isPrivatePath('/%zz')).toBe(true);
  expect(isApiPath('/%zz')).toBe(true);
});

test('homepage loads without horizontal overflow or page errors', async ({ page }) => { const errors=[]; page.on('pageerror',e=>errors.push(e.message)); await page.goto('/index.html'); await expect(page.locator('#splash')).toBeVisible(); expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false); expect(errors).toEqual([]); });
test('homepage exposes one visually hidden primary heading', async ({ page }) => {
  await page.goto('/index.html');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveCount(1);
  await expect(heading).toHaveText('The Grifflist — Live Repertoire and Song Requests');
  await expect(heading).toHaveClass(/visually-hidden/);
});
test('private dashboard exposes one main landmark and its page heading', async ({ page }) => {
  await page.goto('/admin.html');
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Request Dashboard');
});
test('title screen can be entered', async ({ page }) => { await page.goto('/index.html'); await page.locator('#splash').click(); await expect(page.locator('#catalog')).toBeVisible(); });
test('next-show strip does not invent an unconfirmed booking', async ({ page }) => {
  await page.goto('/index.html');
  const card = page.locator('.next-show-card');
  await expect(card.locator('.eyebrow')).toHaveText('UPCOMING SHOWS');
  await expect(card.locator('#next-show-title')).toHaveText('Next date to be announced');
  await expect(card).toContainText('No upcoming performance date is currently confirmed.');
  await expect(card.locator('time')).toHaveCount(0);
  await expect(card.locator('a[href="#catalog"]')).toHaveText('BROWSE SONGS ↗');
  await expect(card).not.toContainText('Hunter’s Ale House');
  await expect(card).not.toContainText('November 10');
  await expect(card).not.toContainText('December 3');
  await expect(card).not.toContainText('December 17');
});

test('home Watch Live CTA checks status when no stream is active', async ({ page }) => {
  await page.route('**/rest/v1/live_show_settings*', async route => {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer, accept, x-client-info, range, range-unit, accept-profile, content-profile',
    };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ venue_name: 'Hunter’s Ale House', show_enabled: true, is_live: false }),
    });
  });
  await page.goto('/index.html');
  const cta = page.locator('#home-watch-live-button');
  await expect(cta).toHaveText('CHECK LIVE STATUS ↗');
  await expect(cta).toHaveAttribute('href', 'watch-live.html');
});

test('home Watch Live CTA advertises a live stream only when confirmed', async ({ page }) => {
  await page.route('**/rest/v1/live_show_settings*', async route => {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer, accept, x-client-info, range, range-unit, accept-profile, content-profile',
    };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ venue_name: 'Hunter’s Ale House', show_enabled: true, is_live: true }),
    });
  });
  await page.goto('/index.html');
  await expect(page.locator('#home-watch-live-button'))
    .toHaveText('● WATCH LIVE AT HUNTER’S ALE HOUSE');
});
test('Watch Live recording disclosure and controls fail closed pending rights approval', async ({ page }) => {
  await page.goto('/watch-live.html');
  const disclosure = page.locator('.recording-disclosure');
  await expect(disclosure).toContainText('32 MiB');
  await expect(disclosure).toContainText('permission to capture');
  await expect(disclosure).toContainText('Recording is disabled until the owner confirms');
  await expect(disclosure).toContainText('do not redistribute copyrighted material');
  await expect(page.locator('#recording-mode')).toBeDisabled();
  await expect(page.locator('#recording-start')).toBeDisabled();
  await expect.poll(() => page.evaluate(() => window.GrifflistRecordingSafety?.RECORDING_RIGHTS_APPROVED)).toBe(false);
  await expect.poll(() => page.evaluate(() => Object.isFrozen(window.GrifflistRecordingSafety))).toBe(true);
});

test('What’s New opens for a new release and records dismissal', async ({ page }) => {
  await page.addInitScript(() => {
    Date.now = () => new Date('2026-11-01T12:00:00-04:00').getTime();
    try { localStorage.removeItem('grifflistWhatsNewSeen.v1'); } catch (_) {}
  });
  await page.goto('/index.html');
  await page.locator('#splash').click();
  const dialog = page.locator('#whats-new-dialog');
  await expect(dialog).toBeVisible();
  await page.locator('#whats-new-done').click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('grifflistWhatsNewSeen.v1')))
    .toBe('v40-seasonal-navigation-polish');
});
test('public offline pages use stylesheet variants present in the service-worker shell', () => {
  const coreStart = serviceWorkerSource.indexOf('const CORE = [');
  const coreEnd = serviceWorkerSource.indexOf('];', coreStart);
  expect(coreStart).toBeGreaterThanOrEqual(0);
  expect(coreEnd).toBeGreaterThan(coreStart);
  const coreSource = serviceWorkerSource.slice(coreStart, coreEnd);
  const cachedPaths = new Set([...coreSource.matchAll(/'([^']+)'/g)].map(match => match[1]));

  for (const page of ['index.html', 'explore.html', 'watch-live.html', 'taxi-services.html', 'roadmap.html']) {
    const html = fs.readFileSync(`${__dirname}/${page}`, 'utf8');
    const stylesheets = [...html.matchAll(/href=["']([^"']*styles.css[^"']*)["']/gi)]
      .map(match => match[1]);
    expect(stylesheets.length, page).toBeGreaterThan(0);
    for (const href of stylesheets) {
      expect(cachedPaths.has(`./${href}`), `${page} stylesheet ${href}`).toBe(true);
    }
  }

  expect(serviceWorkerCacheName).toMatch(/^grifflist-livekit-offline-v\d+$/);
});

test('PWA manifest is available with app shortcuts', async ({ request }) => { const response=await request.get('/manifest.webmanifest'); expect(response.ok()).toBeTruthy(); const manifest=await response.json(); expect(manifest.display).toBe('standalone'); expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3); });

async function waitForActiveCacheController(page, expectedCache) {
  await page.waitForFunction(async (cacheName) => {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration();
    const active = registration?.active;
    // A newly installed worker can create its cache before it takes control.
    // Do not mutate that cache or run offline assertions through the previous
    // controller while activation is still in flight.
    if (!active ||
        active.state !== 'activated' ||
        navigator.serviceWorker.controller !== active ||
        registration.installing ||
        registration.waiting) {
      return false;
    }
    const names = await caches.keys();
    return names.includes(cacheName) &&
      !names.some(name =>
        name.startsWith('grifflist-livekit-offline-') && name !== cacheName
      );
  }, expectedCache, { timeout: 30000 });
}

test('public offline shell registers, falls back offline, and never caches private pages', async ({ page }) => {
  await page.goto('/index.html');
  const cacheName = serviceWorkerCacheName;
  await waitForActiveCacheController(page, cacheName);
  await page.reload();
  await waitForActiveCacheController(page, cacheName);
  const initial = await page.evaluate(async (name) => {
    const cache = await caches.open(name);
    return (await cache.keys()).map(request => {
      const url = new URL(request.url);
      return `${url.pathname}${url.search}`;
    });
  }, cacheName);
  expect(initial).toContain('/index.html');
  expect(initial).toContain('/offline.html');
  expect(initial).toContain('/roadmap.html');
  expect(initial).toContain('/styles.css?v=grifflist-tour-roadmap-1');
  expect(initial).toContain('/script.js?v=payment-security-pause-1');
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.locator('#offline-status')).toBeVisible();
  await expect(page.locator('#offline-status')).toContainText('Nothing is queued while offline');
  await page.context().setOffline(false);
  await expect(page.locator('#offline-status')).toBeHidden();


  const removedWatchLive = await page.evaluate(async (name) => {
    const cache = await caches.open(name);
    const key = (await cache.keys()).find(request => new URL(request.url).pathname === '/watch-live.html');
    if (!key) return false;
    const deleted = await cache.delete(key);
    return deleted && !(await cache.match(key));
  }, cacheName);
  expect(removedWatchLive).toBe(true);
  // Chromium's page-target offline emulation does not reliably force the
  // service-worker target's own fetch() to fail. Simulate that network failure
  // inside the active worker so this assertion deterministically exercises its
  // CacheStorage offline fallback rather than an HTTP-cache response.
  const serviceWorker = page.context().serviceWorkers().find(worker =>
    new URL(worker.url()).pathname.endsWith('/sw.js')
  );
  expect(serviceWorker, 'the active public service worker must be inspectable').toBeTruthy();
  await serviceWorker.evaluate(() => {
    globalThis.__grifflistOriginalFetchForTest = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const requestUrl = typeof input === 'string' ? input : input.url;
      if (new URL(requestUrl, self.registration.scope).pathname === '/watch-live.html') {
        throw new TypeError('Simulated offline network failure');
      }
      return globalThis.__grifflistOriginalFetchForTest(input, init);
    };
  });

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.clearBrowserCache');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  try {
    await page.context().setOffline(true);
    await page.goto('/watch-live.html');
    await expect(page.locator('h1')).toContainText("You're offline");
  } finally {
    await page.context().setOffline(false);
    const activeWorker = page.context().serviceWorkers().find(worker =>
      new URL(worker.url()).pathname.endsWith('/sw.js')
    );
    if (activeWorker) {
      await activeWorker.evaluate(() => {
        if (globalThis.__grifflistOriginalFetchForTest) {
          globalThis.fetch = globalThis.__grifflistOriginalFetchForTest;
          delete globalThis.__grifflistOriginalFetchForTest;
        }
      });
    }
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
    await cdp.detach();
  }

  // The public tour roadmap includes a device-local journal. Cache only its
  // static shell; the journal data remains in localStorage, not Cache Storage.
  await page.context().setOffline(true);
  await page.goto('/roadmap.html');
  await expect(page.locator('h1')).toContainText('THE ROAD');
  await expect(page.locator('#gig-form')).toBeVisible();
  await page.context().setOffline(false);

  await page.goto('/admin.html');
  await page.goto('/request-archive.html');
  await page.goto('/analytics.html');
  const privatePaths = await page.evaluate(async (name) => {
    const cache = await caches.open(name);
    const paths = (await cache.keys()).map(request => new URL(request.url).pathname);
    return [
      '/admin.html', '/admin.js', '/admin-features.js',
      '/analytics.html', '/analytics-dashboard.js', '/analytics-tracker.js',
      '/request-archive.html', '/request-archive.js', '/supabase-config.js'
    ].filter(path => paths.includes(path));
  }, cacheName);
  expect(privatePaths).toEqual([]);
});


test('authenticated same-origin asset requests bypass the offline cache', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration?.active && navigator.serviceWorker.controller);
  }, null, { timeout: 30000 });
  await page.reload();

  const cached = await page.evaluate(async (name) => {
    const url = new URL('/explore.html?auth-cache-probe=1', location.origin);
    const response = await fetch(url, {
      headers: { Authorization: 'Bearer test-only' }
    });
    if (!response.ok) throw new Error(`Probe request failed: ${response.status}`);
    const cache = await caches.open(name);
    return (await cache.keys()).some(request => request.url === url.href);
  }, serviceWorkerCacheName);
  expect(cached).toBe(false);
});


test('same-origin cookie-bearing public navigation is not persisted in Cache Storage', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration?.active && navigator.serviceWorker.controller);
  }, null, { timeout: 30000 });
  await page.reload();

  const url = await page.evaluate(() => new URL('/explore.html', location.origin).href);
  await page.evaluate(() => {
    document.cookie = 'um-cache-privacy-probe=1; Path=/; SameSite=Lax';
  });
  await page.evaluate(async ({ name, target }) => {
    const cache = await caches.open(name);
    await cache.delete(target);
  }, { name: serviceWorkerCacheName, target: url });

  await page.goto('/explore.html');
  const persisted = await page.evaluate(async ({ name, target }) => {
    const cache = await caches.open(name);
    return (await cache.keys()).some(request => request.url === target);
  }, { name: serviceWorkerCacheName, target: url });
  expect(persisted).toBe(false);
});
test('request form exposes accessible names for every public field and keeps keyboard order', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();

  const fields = [
    ['Your name, required', '#requester-name'],
    ['Song name', '#request-song'],
    ['Artist name', '#request-artist'],
    ['Dedication / special instructions (optional)', '#request-message'],
  ];
  for (const [accessibleName, selector] of fields) {
    const control = page.getByLabel(accessibleName, { exact: true });
    await expect(control).toHaveCount(1);
    await expect(control).toHaveAttribute('id', selector.slice(1));
  }

  const name = page.getByLabel('Your name, required', { exact: true });
  const song = page.getByLabel('Song name', { exact: true });
  await expect(name).toHaveAttribute('required', '');
  await name.focus();
  await expect(name).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(song).toBeFocused();

  // The optional payment selector must become discoverable only after the
  // visitor opts into a priority request; hidden controls are not exposed.
  const paymentWrap = page.locator('#priority-payment-wrap');
  const paymentMethod = page.locator('#priority-payment-method');
  await expect(paymentWrap).toBeHidden();
  await expect(paymentMethod).toBeHidden();
  await page.locator('#priority-request').check();
  await expect(paymentWrap).toBeVisible();
  await expect(paymentMethod).toBeVisible();
  await expect(paymentMethod).toHaveAccessibleName(/Payment method/);
});

test('tip surfaces do not advertise unverified wallet methods before checkout', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  const homeTips = page.locator('#tip-options');
  await expect(homeTips.locator('.payment-kofi')).toHaveAttribute('href', 'https://ko-fi.com/thegrifflist');
  await expect(homeTips.locator('.payment-paypal')).toHaveAttribute('href', 'https://www.paypal.com/ncp/payment/NWLZL44VCLAYN');
  await expect(homeTips.locator('.payment-wallet-logos')).toHaveCount(0);
  await expect(homeTips.locator('.payment-disclosure'))
    .toContainText('eligible Stripe connection');
  await expect(homeTips.locator('.payment-disclosure'))
    .toContainText('Checkout shows the methods actually available');

  await page.goto('/watch-live.html');
  const liveTips = page.locator('.live-tip-card');
  await expect(liveTips.locator('.payment-kofi')).toHaveAttribute('href', 'https://ko-fi.com/thegrifflist');
  await expect(liveTips.locator('.payment-paypal')).toHaveAttribute('href', 'https://www.paypal.com/ncp/payment/NWLZL44VCLAYN');
  await expect(liveTips.locator('.payment-wallet-logos')).toHaveCount(0);
  await expect(liveTips.locator('.payment-disclosure'))
    .toContainText('eligible Stripe connection');
  await expect(liveTips.locator('.payment-disclosure'))
    .toContainText('Checkout shows the methods actually available');
});

test('catalogue selection fills the request without opening the mobile keyboard', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.locator('#song-reveal summary').click();
  const row = page.locator('#song-list .song-row').first();
  await expect(row).toBeVisible();
  const title = (await row.locator('.song-title').textContent()).trim();
  const artist = (await row.locator('.song-artist').textContent()).trim();
  await row.click();
  await expect(page.locator('#request-song')).toHaveValue(title);
  await expect(page.locator('#request-artist')).toHaveValue(
    artist === 'Artist not listed' ? '' : artist
  );
  await expect(page.locator('#request-hint')).toBeVisible();
  await expect(page.locator('#requester-name')).not.toBeFocused();
});

test('priority payment details appear only after explicit optional opt-in', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  const priority = page.locator('#priority-request');
  const paymentWrap = page.locator('#priority-payment-wrap');
  const paymentMethod = page.locator('#priority-payment-method');
  await expect(priority).not.toBeChecked();
  await expect(priority).not.toHaveAttribute('required', '');
  await expect(paymentWrap).toBeHidden();
  await priority.check();
  await expect(paymentWrap).toBeVisible();
  await expect(paymentMethod).toHaveValue('');
  await priority.uncheck();
  await expect(paymentWrap).toBeHidden();
  await expect(paymentMethod).toHaveValue('');
});

test('e-transfer remains visibly unavailable and exposes no recipient or action', async ({ page }) => {
  for (const route of ['/index.html', '/watch-live.html']) {
    await page.goto(route);
    const card = page.locator('.payment-etransfer');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Temporarily unavailable');
    await expect(card.locator('a, button, input')).toHaveCount(0);
    expect(await card.getAttribute('href')).toBeNull();
    expect(await card.textContent()).not.toContain('@');
  }
});

test('disabled e-transfer fails closed in the priority payment flow', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  const values = await page.locator('#priority-payment-method option')
    .evaluateAll(options => options.map(option => option.value));
  expect(values).toEqual(['', 'kofi', 'paypal']);

  await page.evaluate(() => window.focusPaymentMethod('etransfer'));
  await expect(page.locator('#payment-flow-status'))
    .toHaveText('That payment method is unavailable. Choose Ko-fi or PayPal.');
  await expect(page.locator('.payment-etransfer'))
    .not.toHaveClass(/payment-highlight/);
});

test('requester name is stored only after explicit on-device opt-in', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  const name = page.locator('#requester-name');
  const remember = page.locator('#remember-requester-name');
  await expect(remember).not.toBeChecked();
  await name.fill('Test Listener');
  await name.blur();
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberedName.v2'))).toBeNull();
  await remember.check();
  await name.fill('');
  await name.blur();
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberedName.v2'))).toBeNull();
  await name.fill('Test Listener');
  await name.blur();
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberName.v1'))).toBe('yes');
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberedName.v2'))).toBe('Test Listener');
  await remember.uncheck();
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberName.v1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberedName.v2'))).toBeNull();
});

test('successful request shows success instead of a post-insert JavaScript error', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.evaluate(() => {
    window.supabaseClient = { from: () => ({ insert: async () => ({ error: null }) }) };
  });
  await page.locator('#requester-name').fill('Test Listener');
  await page.locator('#request-song').fill('Test Song');
  await page.locator('#request-form button[type="submit"]').click();
  await expect(page.locator('#form-status')).toHaveText('Request sent! Thanks for helping choose the music.');
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberName.v1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberedName.v2'))).toBeNull();
});

test('successful request retains the name only when the visitor opted in', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.evaluate(() => {
    window.supabaseClient = { from: () => ({ insert: async () => ({ error: null }) }) };
  });
  const name = page.locator('#requester-name');
  const remember = page.locator('#remember-requester-name');
  await remember.check();
  await name.fill('Opted-in Listener');
  await page.locator('#request-song').fill('Test Song');
  await page.locator('#request-form button[type="submit"]').click();
  await expect(page.locator('#form-status')).toHaveText('Request sent! Thanks for helping choose the music.');
  await expect(remember).toBeChecked();
  await expect(name).toHaveValue('Opted-in Listener');
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberName.v1'))).toBe('yes');
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberedName.v2'))).toBe('Opted-in Listener');
});


test('retries an uncertain request with the same tracking token instead of creating a duplicate', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.evaluate(() => {
    const rows = new Map();
    window.__requestTokens = [];
    let firstAttempt = true;
    window.supabaseClient = {
      from: () => ({
        insert: async (payload) => {
          window.__requestTokens.push(payload.tracking_token);
          if (!rows.has(payload.tracking_token)) {
            rows.set(payload.tracking_token, {
              song_title: payload.song_title,
              artist_name: payload.artist_name || '',
              status: 'Received'
            });
          }
          if (firstAttempt) {
            firstAttempt = false;
            return { error: { code: 'NETWORK_ERROR', message: 'response lost after insert' } };
          }
          return { error: { code: '23505', message: 'duplicate tracking token' } };
        }
      }),
      rpc: async (_name, args) => ({
        data: rows.get(args.p_tracking_token) || null,
        error: null
      })
    };
    window.__requestRows = rows;
  });

  await page.locator('#requester-name').fill('Retry Listener');
  await page.locator('#request-song').fill('Retry Song');
  const submit = page.locator('#request-form button[type="submit"]');
  await submit.click();
  await expect(page.locator('#form-status')).toContainText('Request could not be saved');

  const pending = await page.evaluate(() => JSON.parse(sessionStorage.getItem('grifflistLastRequest')));
  expect(pending.state).toBe('pending');
  expect(pending.trackingToken).toMatch(/^[0-9a-f-]{36}$/i);

  await submit.click();
  await expect(page.locator('#form-status')).toHaveText('Request sent! Thanks for helping choose the music.');

  const result = await page.evaluate(() => ({
    tokens: window.__requestTokens,
    rowCount: window.__requestRows.size,
    savedToken: localStorage.getItem('grifflistLastRequestToken.v1'),
    attempt: JSON.parse(sessionStorage.getItem('grifflistLastRequest'))
  }));
  expect(result.tokens).toEqual([pending.trackingToken, pending.trackingToken]);
  expect(result.rowCount).toBe(1);
  expect(result.savedToken).toBe(pending.trackingToken);
  expect(result.attempt.state).toBe('sent');
});

test('uses a new idempotency token when the visitor changes the song after an uncertain request', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.evaluate(() => {
    const rows = new Map();
    window.__requestTokens = [];
    let attempt = 0;
    window.supabaseClient = {
      from: () => ({
        insert: async (payload) => {
          window.__requestTokens.push(payload.tracking_token);
          if (!rows.has(payload.tracking_token)) {
            rows.set(payload.tracking_token, {
              song_title: payload.song_title,
              artist_name: payload.artist_name || '',
              status: 'Received'
            });
          }
          attempt += 1;
          if (attempt === 1) {
            return { error: { code: 'NETWORK_ERROR', message: 'response lost after insert' } };
          }
          return { error: null };
        }
      })
    };
    window.__requestRows = rows;
  });

  await page.locator('#requester-name').fill('Changed Request Listener');
  await page.locator('#request-song').fill('First Uncertain Song');
  const submit = page.locator('#request-form button[type="submit"]');
  await submit.click();
  await expect(page.locator('#form-status')).toContainText('Request could not be saved');
  const first = await page.evaluate(() => JSON.parse(sessionStorage.getItem('grifflistLastRequest')));

  await page.locator('#request-song').fill('Second Song');
  await submit.click();
  await expect(page.locator('#form-status')).toHaveText('Request sent! Thanks for helping choose the music.');

  const result = await page.evaluate(() => ({
    tokens: window.__requestTokens,
    rows: Array.from(window.__requestRows.entries()),
    savedToken: localStorage.getItem('grifflistLastRequestToken.v1'),
    attempt: JSON.parse(sessionStorage.getItem('grifflistLastRequest'))
  }));
  expect(result.tokens).toHaveLength(2);
  expect(result.tokens[0]).toBe(first.trackingToken);
  expect(result.tokens[1]).not.toBe(first.trackingToken);
  expect(result.rows).toHaveLength(2);
  expect(result.rows.map(([, row]) => row.song_title)).toEqual(['First Uncertain Song', 'Second Song']);
  expect(result.savedToken).toBe(result.tokens[1]);
  expect(result.attempt.state).toBe('sent');});

function findMissingHtmlFragmentLinks(pages, origin = 'https://site.invalid') {
  const normalizedOrigin = new URL(origin).origin;
  const pageIds = new Map();

  for (const [page, html] of Object.entries(pages)) {
    pageIds.set(page, new Set(
      [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]),
    ));
  }

  const missing = [];
  for (const [page, html] of Object.entries(pages)) {
    for (const match of html.matchAll(/\bhref=["']([^"']+)["']/g)) {
      const href = match[1].trim();
      if (!href) continue;

      let url;
      try {
        url = new URL(href, `${normalizedOrigin}/${page}`);
      } catch (_) {
        missing.push(`${page}: malformed local link ${href}`);
        continue;
      }
      // Let URL parsing classify absolute, protocol-relative and relative
      // destinations uniformly. Only same-origin HTTP(S) destinations are
      // audited; mailto:, tel:, javascript: and external origins are ignored.
      if (url.origin !== normalizedOrigin || !url.hash) continue;

      let targetPath;
      let targetId;
      try {
        targetPath = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
        targetId = decodeURIComponent(url.hash.slice(1));
      } catch (_) {
        missing.push(`${page}: malformed encoded fragment ${href}`);
        continue;
      }
      if (!targetPath) targetPath = 'index.html';
      if (targetPath.endsWith('/')) targetPath += 'index.html';

      const targetIds = pageIds.get(targetPath);
      // The companion smoke test checks local file existence. This assertion
      // specifically verifies fragments when the destination is an HTML page.
      if (targetIds && targetId && !targetIds.has(targetId)) {
        missing.push(`${page}: ${href} points to missing ${targetPath}#${targetId}`);
      }
    }
  }
  return missing;
}

test('all same-origin HTML fragment links resolve to existing IDs', () => {
  const htmlPages = fs.readdirSync(__dirname)
    .filter(name => name.endsWith('.html'))
    .sort();
  const pages = Object.fromEntries(htmlPages.map(page => [
    page,
    fs.readFileSync(`${__dirname}/${page}`, 'utf8'),
  ]));

  expect(findMissingHtmlFragmentLinks(pages)).toEqual([]);
});

test('fragment audit checks absolute same-origin URLs and ignores external schemes', () => {
  const pages = {
    'index.html': [
      '<a href="https://site.invalid/target.html#present">',
      '<a href="https://site.invalid/target.html#missing">',
      '<a href="https://external.invalid/target.html#ignored">',
      '<a href="mailto:hello@example.invalid">',
      '<a href="tel:+15555550100">',
    ].join(''),
    'target.html': '<div id="present"></div>',
  };

  expect(findMissingHtmlFragmentLinks(pages)).toEqual([
    'index.html: https://site.invalid/target.html#missing points to missing target.html#missing',
  ]);
});


test('service worker caches only query-bearing URLs pinned in CORE', () => {
  const policyStart = serviceWorkerSource.indexOf('const CORE = [');
  const policyEnd = serviceWorkerSource.indexOf('function isCacheableResponse(', policyStart);
  if (policyStart < 0 || policyEnd < 0) {
    throw new Error('Could not extract the production service-worker request policy.');
  }
  const origin = 'https://site.invalid';
  const context = {
    URL,
    self: {
      registration: { scope: `${origin}/` },
      location: { origin },
    },
  };
  vm.runInNewContext(
    `${serviceWorkerSource.slice(policyStart, policyEnd)}\nglobalThis.isCacheableRequest = isCacheableRequest;`,
    context,
  );
  const canCache = (path, options = {}) => {
    const {
      method = 'GET',
      mode = 'no-cors',
      destination = 'image',
      authorization = false,
      range = false,
    } = options;
    const request = {
      method,
      mode,
      destination,
      headers: {
        get: () => null,
        has: name => (name === 'Authorization' && authorization) || (name === 'Range' && range),
      },
    };
    return context.isCacheableRequest(request, new URL(path, origin));
  };

  for (const path of [
    '/styles.css?v=grifflist-v41',
    '/styles.css?v=grifflist-tour-roadmap-1',
    '/brand-system.css?v=sitewide-v2',
    '/script.js?v=payment-security-pause-1',
    '/script.js?v=grifflist-v28',
    '/site-interactions.js?v=grifflist-v42',
    '/live-show.js?v=grifflist-v31',
    '/recording-safety.js?v=rights-gate-1',
  ]) {
    expect(canCache(path, { destination: 'style' }), path).toBe(true);
  }
  expect(canCache('/index.html', { mode: 'navigate', destination: '' })).toBe(true);
  expect(canCache('/explore.html', { mode: 'navigate', destination: '' })).toBe(true);
  expect(canCache('/logo.webp', { destination: 'image' })).toBe(true);
  expect(canCache('/logo.webp', { destination: 'image', range: true })).toBe(false);

  for (const [path, options] of [
    ['/index.html?token=secret', { mode: 'navigate', destination: '' }],
    ['/watch-live.html?session=secret', { mode: 'navigate', destination: '' }],
    ['/styles.css?v=unknown', { destination: 'style' }],
    ['/script.js?token=secret', { destination: 'script' }],
    ['/logo.webp?token=secret', { destination: 'image' }],
  ]) {
    expect(canCache(path, options), path).toBe(false);
  }
  expect(canCache('/index.html', { mode: 'navigate', destination: '', method: 'POST' })).toBe(false);
  expect(canCache('/index.html', { mode: 'navigate', destination: '', authorization: true })).toBe(false);
  expect(canCache('https://external.invalid/logo.webp', { destination: 'image' })).toBe(false);
  expect(canCache('/admin.html', { mode: 'navigate', destination: '' })).toBe(false);
});



test('keyboard users can skip site navigation to the main content', async ({ page }) => {
  const pages = [
    ['/index.html', 'top'],
    ['/explore.html', 'top'],
    ['/roadmap.html', 'main-content'],
    ['/watch-live.html', 'main-content'],
    ['/taxi-services.html', 'main-content'],
    ['/admin.html', 'admin-main'],
  ];

  for (const [path, targetId] of pages) {
    await page.goto(path);
    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toHaveAttribute('href', `#${targetId}`);
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    const focusedTop = await skipLink.evaluate(element => element.getBoundingClientRect().top);
    expect(focusedTop, `${path} skip link must become visible on keyboard focus`).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect(page.locator(`#${targetId}`)).toBeFocused();
  }
});
