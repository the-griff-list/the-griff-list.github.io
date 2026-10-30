# The Grifflist v30 QA Report

## Changes
- Re-issued the What's New announcement as v30 for returning visitors.
- Added styling for the site's neon theme, completing the Night, Day, 80s, and Neon theme variants.
- Improved mobile viewport sizing, safe-area padding, modal scroll containment, and page scroll locking.
- Improved fallback close behavior, focus restoration, hidden-tab timing, and reduced-motion behavior.
- Updated homepage asset query versions and service-worker cache name to v30.

## Automated checks — PASS
- `python3 qa/qa-smoke-test.py`: 7 HTML pages, 13 JavaScript files, 55 service-worker precache entries, manifest, local references, CSS parsing, and image decoding.
- JavaScript syntax checks included in the smoke test.
- ZIP integrity check completed after packaging.

## Real-browser check — BLOCKED
A Playwright Chromium test was attempted against a local HTTP server using a 390×844 mobile viewport, touch emulation, and device scale factor 2. Chromium navigation was blocked by the environment with `net::ERR_BLOCKED_BY_ADMINISTRATOR` for `127.0.0.1`. No visual or interaction pass is claimed.

## Not tested
- Real Samsung/Android browser rendering and touch behavior.
- Actual GitHub Pages deployment, production service-worker activation, Supabase, LiveKit, payment providers, and live audio playback.

No Supabase schema, credentials, payment destinations, or LiveKit configuration were changed.
