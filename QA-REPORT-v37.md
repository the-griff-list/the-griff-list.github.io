# The Grifflist v37 QA report

## Change
- Seasonal What's New decorations now fade in as a contained overlay inside the dialog.
- The effect fades out after its 1.5-second display window.
- Pressing LET'S ROCK immediately removes the seasonal overlay before closing the dialog, so particles cannot remain visible after the dialog closes.
- Dialog close events also clear the effect and its pending timer.
- The animation remains clipped by the dialog's rounded bounds and respects reduced-motion preferences.
- Updated the service-worker cache identifier and front-end asset cache-busters to v37.

## Checks performed
- `node --check` passed for all 15 top-level JavaScript files.
- CSS file retained the dialog-contained clipping and reduced-motion rules; added wrapper fade transitions.
- Confirmed seasonal effect cleanup is called both by the LET'S ROCK action and the dialog close event.
- ZIP archive integrity checked after packaging.

## Not performed
- Real Chromium/Playwright execution and physical Android/iOS device testing remain outstanding in this environment. Do not interpret these static checks as real-device certification.
