# Browser testing for The Grifflist v31

This release includes a Playwright suite for desktop Chromium, Pixel-sized touch Chromium, and iPhone-sized WebKit.

## Run against GitHub Pages
1. Install Node.js 20 or newer.
2. From the repository root run `npm install`.
3. Run `npx playwright install chromium webkit`.
4. Set `GRIFFLIST_BASE_URL` to the deployed HTTPS site URL.
5. Run `npm run test:browser`.

The suite checks page errors, horizontal overflow, title-screen entry, What's New reopening/dismissal, and manifest shortcuts. It does not validate every payment, Supabase, LiveKit, audio, geolocation, or device-specific behavior. Browser emulation is not a substitute for physical Samsung and Apple devices.
