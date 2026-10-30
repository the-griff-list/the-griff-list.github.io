# Grifflist v28 QA report

## Automated checks run against the release folder

- 7 HTML pages parsed; no duplicate IDs.
- All local `src` and `href` file references resolve.
- 12 JavaScript files pass `node --check`.
- `manifest.webmanifest` parses as JSON.
- All 54 service-worker precache entries exist.
- `styles.css` parses with zero top-level CSS parse errors.
- All 17 bundled PNG/JPEG/WebP images decode successfully.
- Final ZIP integrity test passes.

## Manual/browser checks not completed

The available Chromium environment rejected both `http://127.0.0.1` and `file://` navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`. Consequently, this release has not been visually or interactively verified in a real browser in this session. In particular, phone-specific layout, touch interactions, autoplay, geolocation prompts, Supabase authentication/data, LiveKit broadcasting, and production cache activation still require deployed-site testing.

## Release gate

Do not interpret static checks as proof of zero bugs. After deployment, test the home page, taxi page, Watch Live, request submission, donate links, all three themes, secret menu, and admin sign-in on an actual phone. For performance, use real-user field data and PageSpeed Insights/Search Console; Google's current good Core Web Vitals targets are LCP <= 2.5 s, INP <= 200 ms, and CLS <= 0.1 at the 75th percentile.
