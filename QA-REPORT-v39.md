# The Grifflist V39 QA Report

## Changes
- Taxi page attempts Cars Drive playback automatically on page entry, uses the existing two-player crossfade loop, retries after a visitor gesture if autoplay is blocked, and stops/resumes when the Secret Menu opens/closes.
- Removed the floating Cars Drive play control.
- Homepage session remembers that the title splash has been completed, so refreshing returns to the regular menu and retries menu music.
- Header logo links now return to the request/menu section rather than the title splash.
- Footer logo receives matching theme-specific contrast/glow and a masked shimmer sweep while retaining transparent artwork.
- What's New heading now places the seasonal emoji inline at the end of the heading; seasonal effect lasts about 3 seconds and remains clipped to the dialog.
- Toolbar uses the requested column-first 3x3 order, larger text, theme-aware borders, and visible overflow.
- Section highlight is rendered inset to avoid clipping at the bottom edge.
- Taxi CTA border removed and lower shadow retained.

## Checks performed
- `node --check` passed for `script.js`, `site-interactions.js`, and `whats-new.js`.
- HTML parsing passed for index, taxi-services, watch-live, and explore pages.
- CSS parsing and ZIP integrity checked during packaging.

## Not verified
- No live browser session or physical-device test was available in this environment.
- Browser autoplay policies may block unmuted audio until the visitor interacts. V39 attempts autoplay and retries after interaction; it cannot override browser policy.
- Actual toolbar positioning, seasonal animation appearance, and logo effects need visual confirmation on a published HTTPS build.
