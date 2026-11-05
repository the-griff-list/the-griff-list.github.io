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
if (!cachePolicyMatch) throw new Error('Could not extract the production service-worker cache policy.');
const cachePolicyContext = {};
vm.runInNewContext(
  `${cachePolicyMatch[0]}\nglobalThis.isCacheableResponse = isCacheableResponse;`,
  cachePolicyContext,
);

test('service worker refuses responses that require HTTP revalidation before reuse', async () => {
  const isCacheable = cachePolicyContext.isCacheableResponse;
  const response = ({ cacheControl = '', pragma = '', vary = '', ok = true, type = 'basic' } = {}) => ({
    ok,
    type,
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
});

test('service worker fails closed on encoded private and API paths', async () => {
  const pathPolicyStart = serviceWorkerSource.indexOf('const PRIVATE_PATHS = new Set([');
  const pathPolicyEnd = serviceWorkerSource.indexOf('function isCacheableResponse(', pathPolicyStart);
  if (pathPolicyStart < 0 || pathPolicyEnd < 0) {
    throw new Error('Could not extract the production service-worker path policy.');
  }
  const pathPolicyContext = {};
  vm.runInNewContext(
    `${serviceWorkerSource.slice(pathPolicyStart, pathPolicyEnd)}
globalThis.isPrivatePath = isPrivatePath;
globalThis.isApiPath = isApiPath;`,
    pathPolicyContext,
  );

  const isPrivatePath = pathPolicyContext.isPrivatePath;
  const isApiPath = pathPolicyContext.isApiPath;
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
    '/%61nalytics-dashboard.js',
    '/%72equest-archive.js',
    '/supabase-config%2ejs',
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
    '/graphql/v1',
  ]) {
    expect(isApiPath(pathname), pathname).toBe(true);
  }

  // Public assets containing ordinary encoded spaces must remain cache-eligible.
  expect(isPrivatePath('/Title%20screen.mp3')).toBe(false);
  expect(isPrivatePath('/%zz')).toBe(true);
  expect(isApiPath('/%zz')).toBe(true);
});

test('homepage loads without horizontal overflow or page errors', async ({ page }) => { const errors=[]; page.on('pageerror',e=>errors.push(e.message)); await page.goto('/index.html'); await expect(page.locator('#splash')).toBeVisible(); expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false); expect(errors).toEqual([]); });
test('title screen can be entered', async ({ page }) => { await page.goto('/index.html'); await page.locator('#splash').click(); await expect(page.locator('#catalog')).toBeVisible(); });
test('home Watch Live CTA checks status without promising an active stream', async ({ page }) => {
  await page.goto('/index.html');
  const cta = page.locator('#home-watch-live-button');
  await expect(cta).toHaveText('CHECK LIVE STATUS ↗');
  await expect(cta).toHaveAttribute('href', 'watch-live.html');
});
test('What’s New can be reopened and dismissed', async ({ page }) => { await page.goto('/index.html'); await page.locator('#splash').click(); const reopen=page.locator('#whats-new-reopen'); await expect(reopen).toBeVisible(); await reopen.click(); const dialog=page.locator('#whats-new-dialog'); await expect(dialog).toBeVisible(); await page.locator('#whats-new-done').click(); await expect(dialog).not.toBeVisible(); });
test('PWA manifest is available with app shortcuts', async ({ request }) => { const response=await request.get('/manifest.webmanifest'); expect(response.ok()).toBeTruthy(); const manifest=await response.json(); expect(manifest.display).toBe('standalone'); expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3); });

test('public offline shell registers, falls back offline, and never caches private pages', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration?.active && navigator.serviceWorker.controller);
  }, null, { timeout: 30000 });
  await page.reload();

  const cacheName = serviceWorkerCacheName;
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


  await page.evaluate(async (name) => {
    const cache = await caches.open(name);
    await cache.delete('/watch-live.html');
  }, cacheName);
  await page.context().setOffline(true);
  await page.goto('/watch-live.html');
  await expect(page.locator('h1')).toContainText("You're offline");
  await page.context().setOffline(false);

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


test('request form exposes required, keyboard-reachable fields', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  const name = page.locator('#requester-name');
  const song = page.locator('#request-song');
  await expect(name).toHaveAttribute('required', '');
  await expect(name).toHaveAttribute('aria-label', 'Your name, required');
  await name.focus();
  await expect(name).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(song).toBeFocused();
});

test('tip checkout disclosure does not promise unavailable wallets', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#splash').click();
  await expect(page.locator('#tip-options .payment-disclosure'))
    .toContainText('eligible Stripe connection');
  await expect(page.locator('#tip-options .payment-disclosure'))
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
