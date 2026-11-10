# November 10, 2026 — pre-gig website checklist

**Confirmed booking:** Hunter’s Ale House · Tuesday, November 10, 2026 · 10:00 p.m.–1:30 a.m. Atlantic (user-confirmed).  
**Later dates:** December 3 and December 17 appeared in an earlier draft, but are not confirmed in the available user-provided context. Do not advertise either as booked or assign a performance time without explicit confirmation.  
**Status:** not executed against the published site. PR #3 remains draft; nothing is deployed. The November 10 set time is distinct from any venue/doors listing, which must not be inferred.

## Before opening doors

- [x] Record the user-confirmed November 10 booking at Hunter’s Ale House, 10:00 p.m.–1:30 a.m. Atlantic. The dates are in Atlantic Standard Time (UTC−04:00); daylight time ended November 1, 2026.
- [x] Update the development homepage to show the user-confirmed November 10 booking; omit later dates pending explicit confirmation.
- [ ] Open the homepage on the actual phone and verify the show strip, navigation, song catalogue, request form and tip section render without horizontal scrolling.
- [ ] Search the catalogue by song and artist; test decade and artist filters; reveal and close the list.
- [ ] Select a song and confirm it fills the request fields correctly.
- [ ] Submit a test request only against a designated test backend or with explicit owner approval. Confirm validation, success/error messaging and duplicate-submit behavior.
- [ ] Verify the priority-request selector is optional and clearly states that it is a request for consideration, not a guaranteed performance.
- [ ] Open the Ko-fi and PayPal destinations manually. Confirm the live checkout displays the payment methods actually available. Do not advertise Apple Pay or Google Pay unless the eligible checkout actually offers them on the test device.
- [ ] Keep e-transfer unavailable until the owner explicitly re-enables and verifies it; confirm stale script paths cannot select or instruct e-transfer.
- [ ] Confirm any payment instructions and recipient details against the owner’s current instructions; never infer or expose credentials from repository content.
- [ ] Check Rock-O-Meter values against the actual admin data. Do not display invented tips, totals or goals.
- [ ] Confirm the homepage CTA reads “CHECK LIVE STATUS” and opens the Watch Live page; it must not imply that a stream is active before the backend marks it live.
- [ ] Open Watch Live and confirm the page clearly distinguishes a live, configured stream from an offline/unavailable preview. Do not promise a stream until phone-to-viewer playback has been tested end-to-end.
- [x] Keep Watch Live recording disabled by default. The owner-controlled rights flag remains false until venue, performer and applicable rights-holder permissions are confirmed; the disclosure is not permission. Do not record a real performance while the flag is false.
- [ ] Verify the Watch Live recording disclosure is visible and accurately states the 32 MiB limit and permission requirement. Do not attempt a recording/download test while the rights flag is false; only use an approved test source after the required permissions are confirmed.
- [ ] Test the page on a second phone or a narrow mobile viewport, including keyboard focus, form labels, button tap targets and the back button.

## Poor-network and recovery checks

- [ ] Load the homepage once, then test navigation and catalogue access with a weak or interrupted connection.
- [ ] Confirm a failed request or backend outage gives a clear retry message rather than a false success.
- [ ] On a designated test backend, simulate a request row being committed while the browser response is lost; retry the identical form and confirm the same tracking token resolves to one row, not a duplicate. Change the song/artist after a failed attempt and confirm a different payload does not inherit the previous request’s token.
- [ ] Confirm missing images or unavailable live-stream services do not block song requests or the tip links.
- [ ] Verify the service worker serves only intended cached assets and that a new deployment updates the cache without trapping visitors on stale code.
- [ ] Confirm encoded, double-encoded and malformed private/admin/API paths bypass service-worker caching, while public assets with encoded spaces still cache normally.
- [ ] Confirm query-bearing navigation and static-asset URLs are cached only when the exact URL is pinned in `sw.js` `CORE`; arbitrary token/query parameters and unknown version parameters must bypass Cache Storage.
- [ ] Confirm decoded `.` / `..` path segments cannot traverse into admin, analytics, request-archive or API routes before the offline worker classifies a request.
- [ ] For a future owner-approved release, verify development cache generation `grifflist-livekit-offline-v61` and confirm v60 is retired only after successful activation. Published `main` remains v38 until an explicitly approved deployment.
- [ ] Verify admin, analytics, request-archive pages, Supabase config and API responses are never cached by the offline worker.
- [ ] Confirm same-origin requests carrying an Authorization header bypass offline caching, and responses varying by Cookie or Authorization are never cached.
- [ ] Confirm responses with no-cache, must-revalidate, proxy-revalidate, Pragma: no-cache, or zero max-age directives are not cached for offline reuse.
- [ ] With the network disabled, confirm cached catalogue access is clearly offline and no request, live stream or payment is shown as successful or queued.
- [ ] Confirm the cached homepage displays its accessible offline status banner and clears it after connectivity returns.

## Release decision

- [ ] Review current-head static and Playwright CI results; do not substitute results from an older commit.
- [ ] Complete actual mobile browser checks and owner-approved live request/payment/stream checks.
- [ ] Review all external links and payment destinations one last time.
- [ ] Obtain explicit owner approval before merging or deploying. This checklist does not authorize publication, payment activation, a new vendor/service, or spending.
