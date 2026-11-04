const { test, expect } = require('@playwright/test');
test('homepage loads without horizontal overflow or page errors', async ({ page }) => { const errors=[]; page.on('pageerror',e=>errors.push(e.message)); await page.goto('/index.html'); await expect(page.locator('#splash')).toBeVisible(); expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false); expect(errors).toEqual([]); });
test('title screen can be entered', async ({ page }) => { await page.goto('/index.html'); await page.locator('#splash').click(); await expect(page.locator('#catalog')).toBeVisible(); });
test('What’s New can be reopened and dismissed', async ({ page }) => { await page.goto('/index.html'); await page.locator('#splash').click(); const reopen=page.locator('#whats-new-reopen'); await expect(reopen).toBeVisible(); await reopen.click(); const dialog=page.locator('#whats-new-dialog'); await expect(dialog).toBeVisible(); await page.locator('#whats-new-done').click(); await expect(dialog).not.toBeVisible(); });
test('PWA manifest is available with app shortcuts', async ({ request }) => { const response=await request.get('/manifest.webmanifest'); expect(response.ok()).toBeTruthy(); const manifest=await response.json(); expect(manifest.display).toBe('standalone'); expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3); });

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
});
