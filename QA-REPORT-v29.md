# The Grifflist v29 QA Report

## Change
Added a “What’s New” dialog on the homepage, triggered after the title screen for returning visitors. Includes theme-aware styling, backdrop blur, persistent dismissal, footer replay control, and offline precache entry.

## Automated checks — PASS
- Parsed all 7 HTML pages and checked for duplicate IDs.
- Checked homepage local `src`/`href` references.
- `node --check` passed for `script.js`, `whats-new.js`, and `site-interactions.js`.
- Existing `qa/qa-smoke-test.py` passed: 7 HTML pages, 13 JavaScript files, 55 service-worker precache entries, manifest, local references, CSS parsing, and image decoding.
- Verified `whats-new.js` is loaded after `script.js` and `site-interactions.js`.
- Verified the title-screen entry handler dispatches the event that triggers the dialog.

## Manual/browser checks not completed
A real browser interaction/visual test was not possible in the available environment; previous local Chromium navigation was blocked by the environment. Therefore, mobile appearance, backdrop blur on target devices, keyboard/focus behavior, actual localStorage behavior in production, and theme rendering still need a real-device check after deployment.

## Behavior notes
- Existing visitors are detected using previously stored Grifflist theme/name/request data.
- New visitors are not shown this release dialog and have the current release marked seen.
- Dismissal is stored in localStorage; the footer link reopens the dialog.
- Storage is browser/device-specific. Clearing site data or using a new browser makes a visitor appear new.
