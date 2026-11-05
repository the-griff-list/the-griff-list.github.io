# November 6, 2026 — pre-gig website checklist

**Status:** prepared on the draft development branch; not executed against the published site. PR #3 remains draft and nothing is deployed.

## Before opening doors

- [x] Confirm the venue's official November calendar listing: Griff & Guest at Hunter’s Ale House, Friday, November 6, 2026 at 11:00 p.m. Atlantic (source: https://rihg.ca/events/category/hunters/2026-11/). The semantic `datetime` uses America/Halifax AST (UTC−04:00); daylight time ended November 1, 2026.
- [ ] Reconcile the performance time before publication: the latest user-provided set time is 10:00 p.m., while the venue calendar lists the event at 11:00 p.m. Confirm whether 10:00 p.m. is the set time and 11:00 p.m. the venue listing/start; do not silently change either value.
- [ ] Open the homepage on the actual phone and verify the show strip, navigation, song catalogue, request form and tip section render without horizontal scrolling.
- [ ] Search the catalogue by song and artist; test decade and artist filters; reveal and close the list.
- [ ] Select a song and confirm it fills the request fields correctly.
- [ ] Submit a test request only against a designated test backend or with explicit owner approval. Confirm validation, success/error messaging and duplicate-submit behavior.
- [ ] Verify the priority-request selector is optional and clearly states that it is a request for consideration, not a guaranteed performance.
- [ ] Open the Ko-fi and PayPal destinations manually. Confirm the live checkout displays the payment methods actually available. Do not advertise Apple Pay or Google Pay unless the eligible Stripe-backed Ko-fi checkout actually offers them on the test device.
- [ ] Keep e-transfer unavailable until the owner explicitly re-enables and verifies it; confirm stale script paths cannot select or instruct e-transfer.
- [ ] Confirm any e-transfer instructions and recipient details against the owner's current instructions; never infer or expose credentials from repository content.
- [ ] Check Rock-O-Meter values against the actual admin data. Do not display invented tips, totals or goals.
- [ ] Confirm the homepage CTA reads “CHECK LIVE STATUS” and opens the Watch Live page; it must not imply that a stream is active before the backend marks it live.
- [ ] Open Watch Live and confirm the page clearly distinguishes a live, configured stream from an offline/unavailable preview. Do not promise a stream until phone-to-viewer playback has been tested end-to-end.
- [ ] Test the page on a second phone or a narrow mobile viewport, including keyboard focus, form labels, button tap targets and the back button.

## Poor-network and recovery checks

- [ ] Load the homepage once, then test navigation and catalogue access with a weak or interrupted connection.
- [ ] Confirm a failed request or backend outage gives a clear retry message rather than a false success.
- [ ] On a designated test backend, simulate a request row being committed while the browser response is lost; retry the identical form and confirm the same tracking token resolves to one row, not a duplicate. Change the song/artist after a failed attempt and confirm a different payload does not inherit the previous request's token.
- [ ] Confirm missing images or unavailable live-stream services do not block song requests or the tip links.
- [ ] Verify the service worker serves only the intended cached assets and that a new deployment can update the cache without trapping visitors on stale code.
- [ ] Confirm encoded, double-encoded and malformed private/admin/API paths bypass service-worker caching, while public assets with encoded spaces still cache normally.
- [ ] Confirm decoded `.` / `..` path segments cannot traverse into admin, analytics, request-archive or API routes before the offline worker classifies a request.
- [ ] Confirm the service-worker cache version is bumped when public shell assets or their versioned query strings change.
- [ ] Verify admin, analytics, request-archive pages, Supabase config and API responses are never cached by the offline worker.
- [ ] Confirm same-origin requests carrying an Authorization header bypass offline caching, and responses varying by Cookie or Authorization are never cached.
- [ ] Confirm responses with no-cache, must-revalidate, proxy-revalidate, Pragma: no-cache, or zero max-age directives are not cached for offline reuse.
- [ ] With the network disabled, confirm cached catalogue access is clearly offline and no request, live stream or payment is shown as successful or queued.
- [ ] Confirm the cached homepage displays its accessible offline status banner and clears it after connectivity returns.

## Release decision

- [ ] Review the current-head static and Playwright CI results; do not substitute results from an older commit.
- [ ] Complete actual mobile browser checks and owner-approved live request/payment/stream checks.
- [ ] Review all external links and payment destinations one last time.
- [ ] Obtain explicit owner approval before merging or deploying. This checklist does not authorize publication, payment activation, a new vendor/service, or spending.
