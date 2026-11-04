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
