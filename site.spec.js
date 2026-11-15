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
test('all public pages remain error-free and horizontally contained at mobile sizes', async ({ page }) => {
  test.setTimeout(60000);
  const publicPages = [
    '/index.html',
    '/explore.html',
    '/watch-live.html',
    '/taxi-services.html',
    '/roadmap.html',
    '/offline.html',
  ];

  for (const path of publicPages) {
    const pageErrors = [];
    const onPageError = error => pageErrors.push(error.message);
    page.on('pageerror', onPageError);
    try {
      await page.goto(path);
      await expect(page.locator('body')).toBeVisible();
      const layout = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        layout.scrollWidth,
        `${path} must not overflow horizontally at the current viewport`,
      ).toBeLessThanOrEqual(layout.clientWidth);
      expect(pageErrors, `${path} must not throw uncaught JavaScript errors`).toEqual([]);
    } finally {
      page.off('pageerror', onPageError);
    }
  }
});

test('only pages with live Rockometer or Encore widgets schedule 8-second refreshes', async ({ page }) => {
  await page.addInitScript(() => {
    const originalSetInterval = window.setInterval.bind(window);
    window.__grifflistIntervalDelays = [];
    window.setInterval = (handler, delay, ...args) => {
      window.__grifflistIntervalDelays.push(Number(delay));
      return originalSetInterval(handler, delay, ...args);
    };
  });

  for (const path of ['/taxi-services.html', '/roadmap.html', '/offline.html']) {
    await page.goto(path);
    const refreshCount = await page.evaluate(() =>
      window.__grifflistIntervalDelays.filter(delay => delay === 8000).length
    );
    expect(refreshCount, `${path} must not install the live-widget refresh timer`).toBe(0);
  }

  await page.goto('/explore.html');
  const encoreRefreshCount = await page.evaluate(() =>
    window.__grifflistIntervalDelays.filter(delay => delay === 8000).length
  );
  expect(encoreRefreshCount, 'Explore has an Encore widget and must retain its refresh timer').toBe(1);
});

test('shared script tolerates incomplete optional request and booking controls', async ({ page }) => {
  await page.route('**/explore.html', async route => {
    const response = await route.fetch();
    const html = await response.text();
    const scriptStart = html.indexOf('<script src="script.js');
    expect(scriptStart).toBeGreaterThanOrEqual(0);
    const scriptEnd = html.indexOf('</script>', scriptStart);
    expect(scriptEnd).toBeGreaterThan(scriptStart);
    const scriptTag = html.slice(scriptStart, scriptEnd + '</script>'.length);
    const controls = '<button id="check-last-request" type="button">Check request</button>' +
      '<button id="booking-copy" type="button">Copy booking email</button>';
    await route.fulfill({
      response,
      body: html.replace(scriptTag, controls + scriptTag),
    });
  });

  await page.addInitScript(() => {
    window.__grifflistRuntimeErrors = [];
    window.addEventListener('error', event => {
      window.__grifflistRuntimeErrors.push(event.message);
    });
    window.addEventListener('unhandledrejection', event => {
      const reason = event.reason;
      window.__grifflistRuntimeErrors.push(
        reason && reason.message ? reason.message : String(reason),
      );
    });
  });

  await page.goto('/explore.html');
  await page.locator('#check-last-request').click();
  await page.locator('#booking-copy').click();
  await page.waitForTimeout(50);
  const errors = await page.evaluate(() => window.__grifflistRuntimeErrors);
  expect(errors).toEqual([]);
});

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
test('next-show strip lists the confirmed December Hunter’s dates and performance windows', async ({ page }) => {
  await page.goto('/index.html');
  const card = page.locator('.next-show-card');
  await expect(card.locator('.eyebrow')).toHaveText('UPCOMING SHOWS');
  await expect(card.locator('#next-show-title')).toHaveText('Next show');
  await expect(card).toContainText('Hunter’s Ale House');
  await expect(card.locator('a[href="#catalog"]')).toHaveText('BROWSE SONGS ↗');

  const times = card.locator('time');
  await expect(times).toHaveCount(6);
  const expectedTimes = [
    '2026-12-03',
    '2026-12-03T22:00:00-04:00',
    '2026-12-04T01:30:00-04:00',
    '2026-12-17',
    '2026-12-17T22:00:00-04:00',
    '2026-12-18T01:30:00-04:00',
  ];
  for (const [index, datetime] of expectedTimes.entries()) {
    await expect(times.nth(index)).toHaveAttribute('datetime', datetime);
  }
  await expect(card).toContainText('Thursday, December 3, 2026');
  await expect(card).toContainText('Thursday, December 17, 2026');
  await expect(card).toContainText('10:00 p.m.');
  await expect(card).toContainText('1:30 a.m.');
  await expect(card).toContainText('Atlantic');
  await expect(card).not.toContainText('January 1, 2027');
});

test('upcoming-show card and catalog stay usable at compact phone widths', async ({ page }) => {
  await page.goto('/index.html');
  const card = page.locator('.next-show-card');
  const browse = card.locator('a[href="#catalog"]');
  const catalogHeading = page.locator('.catalog-title h2');
  const trackCounter = page.locator('.catalog-title .track-counter');

  for (const width of [320, 360, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(card).toBeVisible();
    await expect(browse).toBeVisible();
    await expect(catalogHeading).toBeVisible();
    await expect(trackCounter).toBeVisible();
    await expect(card.locator('time')).toHaveCount(6);

    const layout = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const overflowingElements = Array.from(document.querySelectorAll('body *'))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            className: typeof element.className === 'string' ? element.className : '',
            left: Math.round(rect.left * 10) / 10,
            right: Math.round(rect.right * 10) / 10,
            width: Math.round(rect.width * 10) / 10,
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
            position: style.position,
            whiteSpace: style.whiteSpace,
            text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
          };
        })
        .filter((item) => item.width > 0 && (item.left < -0.5 || item.right > viewportWidth + 0.5))
        .sort((left, right) => right.right - left.right)
        .slice(0, 20);
      return {
        viewportWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        overflowingElements,
      };
    });
    console.log(`compact show layout at ${width}px: ${JSON.stringify(layout.overflowingElements)}`);
    expect(
      layout.documentWidth,
      `homepage must not overflow at ${width}px; offenders: ${JSON.stringify(layout.overflowingElements)}`,
    ).toBeLessThanOrEqual(layout.viewportWidth);

    const cardBox = await card.boundingBox();
    const browseBox = await browse.boundingBox();
    const headingBox = await catalogHeading.boundingBox();
    const counterBox = await trackCounter.boundingBox();
    expect(cardBox, `show card must have a layout box at ${width}px`).not.toBeNull();
    expect(browseBox, `browse action must have a layout box at ${width}px`).not.toBeNull();
    expect(headingBox, `catalog heading must have a layout box at ${width}px`).not.toBeNull();
    expect(counterBox, `song count must have a layout box at ${width}px`).not.toBeNull();
    expect(cardBox.x, `show card must remain inside the viewport at ${width}px`).toBeGreaterThanOrEqual(0);
    expect(
      cardBox.x + cardBox.width,
      `show card must not extend beyond the viewport at ${width}px`,
    ).toBeLessThanOrEqual(layout.viewportWidth);
    expect(headingBox.x).toBeGreaterThanOrEqual(0);
    expect(headingBox.x + headingBox.width).toBeLessThanOrEqual(layout.viewportWidth);
    expect(counterBox.x).toBeGreaterThanOrEqual(0);
    expect(counterBox.x + counterBox.width).toBeLessThanOrEqual(layout.viewportWidth);
    expect(browseBox.x).toBeGreaterThanOrEqual(cardBox.x);
    expect(
      browseBox.x + browseBox.width,
      `browse action must remain inside the show card at ${width}px`,
    ).toBeLessThanOrEqual(cardBox.x + cardBox.width);
  }
});

test('tour roadmap lists only the two confirmed Hunter’s dates and their performance windows', async ({ page }) => {
  await page.goto('/roadmap.html');
  const dates = page.locator('#confirmed-dates');
  await expect(dates.getByRole('heading', { level: 2 })).toHaveText('CONFIRMED UPCOMING SHOWS');
  await expect(dates).toContainText('Two upcoming Hunter’s Ale House performances are confirmed.');
  await expect(dates).toContainText('planned performance windows, not doors times');

  const cards = dates.locator('article.confirmed-show-card');
  await expect(cards).toHaveCount(2);

  const expectedCards = [
    {
      date: '2026-12-03',
      start: '2026-12-03T22:00:00-04:00',
      end: '2026-12-04T01:30:00-04:00',
    },
    {
      date: '2026-12-17',
      start: '2026-12-17T22:00:00-04:00',
      end: '2026-12-18T01:30:00-04:00',
    },
  ];
  for (const [index, expected] of expectedCards.entries()) {
    const card = cards.nth(index);
    await expect(card.getByRole('heading', { level: 3 })).toHaveText('Hunter’s Ale House');
    const times = card.locator('time');
    await expect(times).toHaveCount(3);
    await expect(times.nth(0)).toHaveAttribute('datetime', expected.date);
    await expect(times.nth(1)).toHaveAttribute('datetime', expected.start);
    await expect(times.nth(2)).toHaveAttribute('datetime', expected.end);
    await expect(card).toContainText('10:00 p.m.');
    await expect(card).toContainText('1:30 a.m.');
    await expect(card).toContainText('Atlantic');
  }
  await expect(dates).not.toContainText('January 1, 2027');
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

test('public offline shell registers and never caches private pages', async ({ page }) => {
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
  expect(initial).toContain('/script.js?v=request-gateway-stage-1');

  // Exercise the app's navigator.onLine event handler without asking WebKit to
  // reload a page while its whole browser context is offline.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    window.dispatchEvent(new Event('offline'));
  });
  await expect(page.locator('#offline-status')).toBeVisible();
  await expect(page.locator('#offline-status')).toContainText('Nothing is queued while offline');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    window.dispatchEvent(new Event('online'));
  });
  await expect(page.locator('#offline-status')).toBeHidden();

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


test('service-worker navigation handler falls back to the offline shell and cached roadmap when fetch rejects', async ({ page, browserName }) => {
  test.skip(
    browserName === 'webkit',
    'This synthetic service-worker event integration check runs in Chromium; WebKit still runs page-level offline UI and cache-scope checks.',
  );
  await page.goto('/index.html');
  await waitForActiveCacheController(page, serviceWorkerCacheName);

  const serviceWorker = page.context().serviceWorkers().find(worker =>
    new URL(worker.url()).pathname.endsWith('/sw.js')
  );
  expect(serviceWorker, 'the active public service worker must be inspectable').toBeTruthy();

  // Dispatch synthetic navigation FetchEvents inside the actual active worker.
  // This exercises its registered fetch listener and real CacheStorage without
  // relying on browser navigation routing or HTTP-cache interception.
  const fallbackResults = await serviceWorker.evaluate(async (cacheName) => {
    const cache = await caches.open(cacheName);
    const watchLiveUrl = new URL('/watch-live.html', self.registration.scope).href;
    const offlineUrl = new URL('/offline.html', self.registration.scope).href;
    const roadmapUrl = new URL('/roadmap.html', self.registration.scope).href;
    const offlineShell = await cache.match(offlineUrl);
    const cachedRoadmap = await cache.match(roadmapUrl);
    if (!offlineShell || !cachedRoadmap) {
      throw new Error('The public offline shell and roadmap must be precached before fallback testing.');
    }
    await cache.delete(watchLiveUrl);

    const originalFetch = globalThis.fetch;
    const failedPaths = [];
    globalThis.fetch = async (input, init) => {
      const requestUrl = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
      const pathname = new URL(requestUrl, self.registration.scope).pathname;
      if (pathname === '/watch-live.html' || pathname === '/roadmap.html') {
        failedPaths.push(pathname);
        throw new TypeError('Simulated offline network failure');
      }
      return originalFetch.call(globalThis, input, init);
    };

    async function dispatchNavigation(pathname) {
      const request = new Request(new URL(pathname, self.registration.scope), {
        credentials: 'omit',
      });
      Object.defineProperties(request, {
        mode: { value: 'navigate' },
        destination: { value: 'document' },
      });
      let responsePromise;
      let waitPromise;
      const event = new Event('fetch');
      Object.defineProperties(event, {
        request: { value: request },
        waitUntil: { value: promise => { waitPromise = Promise.resolve(promise); } },
        respondWith: { value: promise => { responsePromise = Promise.resolve(promise); } },
      });
      self.dispatchEvent(event);
      if (!responsePromise) throw new Error('The service worker did not handle the synthetic navigation event.');
      const response = await responsePromise;
      if (waitPromise) await waitPromise;
      return {
        url: response.url,
        status: response.status,
        body: await response.text(),
      };
    }

    try {
      return {
        watchLive: await dispatchNavigation('/watch-live.html'),
        roadmap: await dispatchNavigation('/roadmap.html'),
        failedPaths,
      };
    } finally {
      globalThis.fetch = originalFetch;
    }
  }, serviceWorkerCacheName);

  expect(fallbackResults.watchLive.status).toBe(200);
  expect(new URL(fallbackResults.watchLive.url).pathname).toBe('/offline.html');
  expect(fallbackResults.watchLive.body).toContain("You're offline");
  expect(fallbackResults.roadmap.status).toBe(200);
  expect(new URL(fallbackResults.roadmap.url).pathname).toBe('/roadmap.html');
  expect(fallbackResults.roadmap.body).toContain('THE ROAD');
  expect(fallbackResults.failedPaths).toEqual(['/watch-live.html', '/roadmap.html']);

  // Confirm both returned public pages also render at browser level.
  await page.goto('/offline.html');
  await expect(page.locator('h1')).toContainText("You're offline");
  await page.goto('/roadmap.html');
  await expect(page.locator('h1')).toContainText('THE ROAD');
  await expect(page.locator('#gig-form')).toBeVisible();
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
  const artist = page.getByLabel('Artist name', { exact: true });
  const rememberName = page.getByLabel('Remember my name on this device (optional)', { exact: true });
  const dedication = page.getByLabel('Dedication / special instructions (optional)', { exact: true });
  const priority = page.getByRole('checkbox', { name: 'Add priority request for $5 CAD' });
  const randomSong = page.locator('#random-request-song');
  const submitRequest = page.locator('#request-form button[type="submit"]');

  await expect(name).toHaveAttribute('required', '');
  await name.focus();
  await expect(name).toBeFocused();
  for (const nextControl of [song, artist, rememberName, dedication, priority]) {
    await page.keyboard.press('Tab');
    await expect(nextControl).toBeFocused();
  }

  // The optional payment selector must remain out of the tab order until
  // priority is explicitly selected, then appear immediately after its toggle.
  const paymentWrap = page.locator('#priority-payment-wrap');
  const paymentMethod = page.locator('#priority-payment-method');
  await expect(paymentWrap).toBeHidden();
  await expect(paymentMethod).toBeHidden();
  await page.keyboard.press('Tab');
  await expect(randomSong).toBeFocused();

  // Use the native keyboard activation path, not Playwright's programmatic
  // check(), so this also verifies Space toggles the optional priority flow.
  await priority.focus();
  await page.keyboard.press('Space');
  await expect(priority).toBeChecked();
  await expect(paymentWrap).toBeVisible();
  await expect(paymentMethod).toBeVisible();
  await expect(paymentMethod).toHaveAccessibleName(/Optional tip method/);
  await page.keyboard.press('Tab');
  await expect(paymentMethod).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(randomSong).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(submitRequest).toBeFocused();

  // Turning priority back off must remove the payment selector from both
  // visibility and sequential keyboard navigation.
  await priority.focus();
  await page.keyboard.press('Space');
  await expect(priority).not.toBeChecked();
  await expect(paymentWrap).toBeHidden();
  await expect(paymentMethod).toBeHidden();
  await page.keyboard.press('Tab');
  await expect(randomSong).toBeFocused();
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

test('song selection and request-status lookup fail closed when local storage is blocked', async ({ page }) => {
  // The assertions finish, but headless Linux WebKit's media-process cleanup can
  // exceed the suite's 30s default. Keep this allowance local to WebKit; do not
  // relax the browser assertion or the workflow-wide timeout.
  if (test.info().project.name === 'iphone-size-touch-webkit') {
    test.setTimeout(45_000);
  }
  // This regression targets the request-status handler, not pointer hit-testing.
  // WebKit can keep the form in a compositor transition after song selection even
  // with reduced motion enabled. Verify the control is exposed, then dispatch its
  // click event directly so the test exercises the handler without waiting for a
  // moving target to satisfy Playwright's pointer-stability heuristic.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'grifflistRememberName.v1' || key === 'grifflistLastRequestToken.v1') {
        throw new DOMException('Storage access is blocked', 'SecurityError');
      }
      return originalGetItem.call(this, key);
    };
    HTMLMediaElement.prototype.play = () => Promise.resolve();
  });

  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.locator('#song-reveal summary').click();
  const row = page.locator('#song-list .song-row').first();
  const title = (await row.locator('.song-title').textContent()).trim();
  await row.click();

  await expect(page.locator('#request-song')).toHaveValue(title);
  await expect(page.locator('#form-status')).toHaveText('');
  const checkLastRequest = page.locator('#check-last-request');
  await expect(checkLastRequest).toBeVisible();
  await expect(checkLastRequest).toBeEnabled();
  await checkLastRequest.dispatchEvent('click');
  await expect(page.locator('#request-status-result'))
    .toContainText('cannot access the saved request token');
  expect(pageErrors).toEqual([]);
});

test('catalogue selection fills the request without opening the mobile keyboard', async ({ page }) => {
  // WebKit's headless Linux media-process teardown intermittently exceeds the
  // suite's 30s default after all assertions have passed. Keep the allowance
  // local to this interaction test and WebKit; assertions remain unchanged.
  if (test.info().project.name === 'iphone-size-touch-webkit') {
    test.setTimeout(45_000);
  }
  // This test covers request selection/focus, not playback. Prevent the splash
  // transition's background music from leaving a WebKit media process alive
  // during browser-context teardown on headless Linux.
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.resolve();
  });
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

test('priority payment details appear only after optional opt-in and disclose manual verification', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  const priority = page.locator('#priority-request');
  const paymentWrap = page.locator('#priority-payment-wrap');
  const paymentMethod = page.locator('#priority-payment-method');
  const disclosure = page.locator('.priority-option-copy small');
  await expect(disclosure).toContainText('Optional $5 CAD tip');
  await expect(disclosure).toContainText('checked manually');
  await expect(disclosure).toContainText('not guaranteed');
  await expect(priority).not.toBeChecked();
  await expect(priority).not.toHaveAttribute('required', '');
  await expect(paymentWrap).toBeHidden();
  await priority.check();
  await expect(paymentWrap).toBeVisible();
  await expect(paymentWrap).toContainText('Optional tip method');
  await expect(paymentMethod).toHaveValue('');
  await priority.uncheck();
  await expect(paymentWrap).toBeHidden();
  await expect(paymentMethod).toHaveValue('');
});

test('priority request status explains manual verification and no playback guarantee', async ({ page }) => {
  await page.addInitScript(() => {
    // supabase-config.js legitimately assigns the SDK client once during bootstrap.
    // Count that expected assignment separately from any later replacement.
    window.__requestClientAssignmentCount = 0;
    window.__requestClientReplacementDetected = false;
    const mockClient = { from: () => ({ insert: async () => ({ error: null }) }) };
    Object.defineProperty(window, 'supabaseClient', {
      configurable: false,
      enumerable: true,
      get: () => mockClient,
      set: () => {
        window.__requestClientAssignmentCount += 1;
        if (window.__requestClientAssignmentCount > 1) {
          window.__requestClientReplacementDetected = true;
        }
      }
    });
  });
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.locator('#requester-name').fill('Test Listener');
  await page.locator('#request-song').fill('Test Song');
  await page.locator('#priority-request').check();
  await page.locator('#priority-payment-method').selectOption('paypal');
  await page.locator('#request-form button[type="submit"]').click();
  await expect(page.locator('#form-status')).toContainText('manual verification');
  await expect(page.locator('#form-status')).toContainText('not guaranteed');
  expect(await page.evaluate(() => window.__requestClientAssignmentCount)).toBe(1);
  expect(await page.evaluate(() => window.__requestClientReplacementDetected)).toBe(false);
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
  // Install the diagnostic before navigation so the application cannot submit
  // before the console-error capture exists.
  await page.addInitScript(() => {
    window.__requestErrors = [];
    const originalConsoleError = console.error.bind(console);
    console.error = (...args) => {
      if (args[0] === 'Request submission failed') {
        const error = args[1];
        window.__requestErrors.push(error instanceof Error
          ? error.name + ': ' + error.message
          : String(error?.code || '') + ': ' + String(error?.message || error));
      }
      originalConsoleError(...args);
    };
    window.addEventListener('error', event => {
      window.__requestErrors.push(event.error instanceof Error
        ? event.error.name + ': ' + event.error.message
        : String(event.message || 'Unhandled window error'));
    });
    window.addEventListener('unhandledrejection', event => {
      const reason = event.reason;
      window.__requestErrors.push(reason instanceof Error
        ? reason.name + ': ' + reason.message
        : String(reason));
    });
  });
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.evaluate(() => {
    window.supabaseClient = { from: () => ({ insert: async () => ({ error: null }) }) };
  });
  await page.locator('#requester-name').fill('Test Listener');
  await page.locator('#request-song').fill('Test Song');
  await page.locator('#request-form button[type="submit"]').click();
  await expect(page.locator('#form-status')).toHaveText(/Request sent!|Request could not be saved/);
  const requestErrors = await page.evaluate(() => window.__requestErrors || []);
  expect(requestErrors, 'Unexpected request failure: ' + requestErrors.join(' | ')).toHaveLength(0);
  expect(await page.locator('#form-status').textContent()).toBe('Request sent! Thanks for helping choose the music.');
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberName.v1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('grifflistRememberedName.v2'))).toBeNull();
});

test('uses the opt-in request gateway and never falls back to direct Supabase INSERT', async ({ page }) => {
  let gatewayPayload = null;
  let directInsert = false;
  let turnstileScriptLoaded = false;
  let turnstileResetCount = 0;

  await page.route('**/supabase-config.js*', async route => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace('requestGatewayUrl: ""', 'requestGatewayUrl: "https://requests.example.workers.dev/submit"')
      .replace('turnstileSiteKey: ""', 'turnstileSiteKey: "test-site-key"');
    await route.fulfill({ response, body });
  });

  await page.route('**/turnstile/v0/api.js*', async route => {
    turnstileScriptLoaded = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.turnstile = { render: function (element, options) { window.__turnstileRendered = true; options.callback("turnstile-test-token"); return 17; }, reset: function () { window.__turnstileResetCount = (window.__turnstileResetCount || 0) + 1; } };'
    });
  });

  // Test the browser-to-gateway request contract without making this UI test
  // depend on each engine's cross-origin preflight implementation. The Worker
  // CORS, origin, redirect and secret-forwarding rules are covered separately
  // by cloudflare-request-gateway.test.mjs.
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.__gatewayFetchCalls = [];
    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (url !== 'https://requests.example.workers.dev/submit') {
        return originalFetch(input, init);
      }
      const body = JSON.parse(String(init.body || '{}'));
      window.__gatewayFetchCalls.push({
        url,
        method: String(init.method || 'GET').toUpperCase(),
        body
      });
      return new Response(JSON.stringify({
        ok: true,
        duplicate: false,
        tracking_token: body.tracking_token
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    };
  });

  await page.route('**/rest/v1/song_requests*', async route => {
    directInsert = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.goto('/index.html');
  await page.locator('#splash').click();
  await expect(page.locator('#request-challenge-wrap')).toBeVisible();
  await expect.poll(() => turnstileScriptLoaded).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__turnstileRendered === true)).toBe(true);
  await page.locator('#requester-name').fill('Gateway Listener');
  await page.locator('#request-song').fill('Gateway Song');
  await page.locator('#request-form button[type="submit"]').click();

  await expect(page.locator('#form-status')).toHaveText('Request sent! Thanks for helping choose the music.');
  const gatewayCalls = await page.evaluate(() => window.__gatewayFetchCalls || []);
  expect(gatewayCalls).toHaveLength(1);
  expect(gatewayCalls[0].url).toBe('https://requests.example.workers.dev/submit');
  expect(gatewayCalls[0].method).toBe('POST');
  gatewayPayload = gatewayCalls[0].body;
  expect(gatewayPayload).toMatchObject({
    requester_name: 'Gateway Listener',
    song_title: 'Gateway Song',
    turnstile_token: 'turnstile-test-token'
  });
  expect(gatewayPayload.tracking_token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  expect(gatewayPayload.client_session_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  expect(gatewayPayload).not.toHaveProperty('status');
  expect(gatewayPayload).not.toHaveProperty('created_at');
  expect(directInsert).toBe(false);
  turnstileResetCount = await page.evaluate(() => window.__turnstileResetCount || 0);
  expect(turnstileResetCount).toBeGreaterThan(0);
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
  await page.evaluate(() => {
    const attempt = JSON.parse(sessionStorage.getItem('grifflistLastRequest'));
    attempt.time = Date.now() - 48 * 60 * 60 * 1000;
    sessionStorage.setItem('grifflistLastRequest', JSON.stringify(attempt));
  });

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
    window.__requestClientReplacementDetected = false;
    window.__requestErrors = [];
    const originalConsoleError = console.error.bind(console);
    console.error = (...args) => {
      if (args[0] === 'Request submission failed') {
        const error = args[1];
        window.__requestErrors.push(error instanceof Error
          ? error.name + ': ' + error.message
          : String(error?.code || '') + ': ' + String(error?.message || error));
      }
      originalConsoleError(...args);
    };
    let attempt = 0;
    const mockClient = {
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

    // Keep this deterministic request mock authoritative if a delayed setup
    // script attempts to assign the live Supabase client after page startup.
    Object.defineProperty(window, 'supabaseClient', {
      configurable: false,
      enumerable: true,
      get: () => mockClient,
      set: () => { window.__requestClientReplacementDetected = true; }
    });
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
    attempt: JSON.parse(sessionStorage.getItem('grifflistLastRequest')),
    clientReplaced: window.__requestClientReplacementDetected
  }));
  expect(result.clientReplaced).toBe(false);
  expect(result.tokens).toHaveLength(2);
  expect(result.tokens[0]).toBe(first.trackingToken);
  expect(result.tokens[1]).not.toBe(first.trackingToken);
  expect(result.rows).toHaveLength(2);
  expect(result.rows.map(([, row]) => row.song_title)).toEqual(['First Uncertain Song', 'Second Song']);
  expect(result.savedToken).toBe(result.tokens[1]);
  expect(result.attempt.state).toBe('sent');});

test('does not send a request when session storage cannot be read for idempotency', async ({ page }) => {
  await page.addInitScript(() => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (this === window.sessionStorage && key === 'grifflistLastRequest') {
        throw new DOMException('session storage blocked', 'SecurityError');
      }
      return originalGetItem.call(this, key);
    };
  });
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.evaluate(() => {
    window.__requestInsertCount = 0;
    window.supabaseClient = {
      from: () => ({ insert: async () => { window.__requestInsertCount += 1; return { error: null }; } })
    };
  });
  await page.locator('#requester-name').fill('Storage Blocked Listener');
  await page.locator('#request-song').fill('Storage Blocked Song');
  await page.locator('#request-form button[type="submit"]').click();
  await expect(page.locator('#form-status')).toContainText('Your request was not sent');
  expect(await page.evaluate(() => window.__requestInsertCount)).toBe(0);
});

test('does not send a request when session storage cannot persist the retry token', async ({ page }) => {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (this === window.sessionStorage && key === 'grifflistLastRequest') {
        throw new DOMException('session storage blocked', 'SecurityError');
      }
      return originalSetItem.call(this, key, value);
    };
  });
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.evaluate(() => {
    window.__requestInsertCount = 0;
    window.supabaseClient = {
      from: () => ({ insert: async () => { window.__requestInsertCount += 1; return { error: null }; } })
    };
  });
  await page.locator('#requester-name').fill('Storage Write Blocked Listener');
  await page.locator('#request-song').fill('Storage Write Blocked Song');
  await page.locator('#request-form button[type="submit"]').click();
  await expect(page.locator('#form-status')).toContainText('Your request was not sent');
  expect(await page.evaluate(() => window.__requestInsertCount)).toBe(0);
});

test('does not send a request when the saved retry record is malformed', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('grifflistLastRequest', '{'));
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.evaluate(() => {
    window.__requestInsertCount = 0;
    window.supabaseClient = {
      from: () => ({ insert: async () => { window.__requestInsertCount += 1; return { error: null }; } })
    };
  });
  await page.locator('#requester-name').fill('Malformed Storage Listener');
  await page.locator('#request-song').fill('Malformed Storage Song');
  await page.locator('#request-form button[type="submit"]').click();
  await expect(page.locator('#form-status')).toContainText('could not be read safely');
  expect(await page.evaluate(() => window.__requestInsertCount)).toBe(0);
});

test('request status falls back to the current tab when local token storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (this === window.localStorage && key === 'grifflistLastRequestToken.v1') {
        throw new DOMException('local token storage blocked', 'SecurityError');
      }
      return originalGetItem.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (this === window.localStorage && key === 'grifflistLastRequestToken.v1') {
        throw new DOMException('local token storage blocked', 'SecurityError');
      }
      return originalSetItem.call(this, key, value);
    };
  });
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.evaluate(() => {
    const client = {
      from: () => ({ insert: async () => ({ error: null }) }),
      rpc: async () => ({
        data: { song_title: 'Fallback Song', artist_name: 'Fallback Artist', status: 'Received' },
        error: null
      })
    };
    Object.defineProperty(window, 'supabaseClient', {
      configurable: false,
      enumerable: true,
      get: () => client,
      set: () => {}
    });
  });
  await page.locator('#requester-name').fill('Fallback Listener');
  await page.locator('#request-song').fill('Fallback Song');
  await page.locator('#request-form button[type="submit"]').click();
  await expect(page.locator('#form-status')).toHaveText('Request sent! Thanks for helping choose the music.');
  await page.locator('#check-last-request').click();
  await expect(page.locator('#request-status-result')).toContainText('Fallback Song');
});



test('request status prefers this tab\'s latest token when local token replacement fails', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grifflistLastRequestToken.v1', '00000000-0000-4000-8000-000000000001');
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (this === window.localStorage && key === 'grifflistLastRequestToken.v1') {
        throw new DOMException('local token quota reached', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    };
  });
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await page.evaluate(() => {
    const client = {
      from: () => ({ insert: async () => ({ error: null }) }),
      rpc: async (_name, args) => {
        window.__statusToken = args.p_tracking_token;
        return {
          data: { song_title: 'Current Tab Song', artist_name: 'Current Tab Artist', status: 'Received' },
          error: null
        };
      }
    };
    Object.defineProperty(window, 'supabaseClient', {
      configurable: false,
      enumerable: true,
      get: () => client,
      set: () => {}
    });
  });
  await page.locator('#requester-name').fill('Current Tab Listener');
  await page.locator('#request-song').fill('Current Tab Song');
  await page.locator('#request-form button[type="submit"]').click();
  const currentToken = await page.evaluate(() => JSON.parse(sessionStorage.getItem('grifflistLastRequest')).trackingToken);
  expect(await page.evaluate(() => localStorage.getItem('grifflistLastRequestToken.v1'))).toBe('00000000-0000-4000-8000-000000000001');
  await page.locator('#check-last-request').click();
  await expect(page.locator('#request-status-result')).toContainText('Current Tab Song');
  expect(await page.evaluate(() => window.__statusToken)).toBe(currentToken);
});

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
    '/brand-system.css?v=sitewide-v3',
    '/script.js?v=request-gateway-stage-1',
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
