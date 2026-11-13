# November 10, 2026 — pre-gig website checklist

**Confirmed booking:** Hunter’s Ale House · Tuesday, November 10, 2026 · 10:00 p.m.–1:30 a.m. Atlantic (user-confirmed).  
**Later dates at archive time:** No later performance booking was confirmed in the available booking history. Do not advertise a future date or performance time until the user confirms it.  
**Status:** archived after the November 10 performance. The pre-gig acceptance checklist was not executed against the published site. PR #3 remains draft; nothing is deployed. The November 10 set time is distinct from any venue/doors listing, which must not be inferred.

## Historical performance-time source discrepancy — November 10, 2026

At the booking review, the published sources did not agree on the performance start time:

- RIHG homepage lists Griff & Guest at 11:00 p.m.
- Hunter’s Ale House category calendar also lists Griff & Guest at 11:00 p.m.
- The user-confirmed 10:00 p.m. performance set was 10:00 p.m.–1:30 a.m. Atlantic.

Keep the distinction explicit in historical records. The venue listings are not proof that the user-confirmed set began at 11:00 p.m.; do not silently replace the user-confirmed set time with the venue listing, or infer doors/set times from either source. This is an archived discrepancy, not a claim that either source is still current.

## Post-event status — November 11, 2026

- The November 10 Hunter’s Ale House booking has passed.
- A fresh review of available prior conversations found no later confirmed performance booking. December 3 and December 17 remain unconfirmed; do not advertise either date or assign a performance time.
- The development homepage now states that no upcoming performance date is currently confirmed and retains the song-catalogue CTA.
- This checklist remains a historical record of the November 10 release-readiness tasks. Its unchecked mobile, request, payment, stream and published-site acceptance items were not completed or represented as passed.
- Next website milestone: wait for a later user-confirmed booking before adding a date or performance time.

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
- [ ] On all six navigation pages, press Tab from a fresh load: the skip link must be the first focused control, become visible, and move focus to the main landmark when activated.
- [ ] In the private dashboard, verify request action buttons remain at least 48px high on desktop and narrow mobile layouts.

## Poor-network and recovery checks

- [ ] Load the homepage once, then test navigation and catalogue access with a weak or interrupted connection.
- [ ] Confirm a failed request or backend outage gives a clear retry message rather than a false success.
- [ ] On a designated test backend, simulate a request row being committed while the browser response is lost; retry the identical form and confirm the same tracking token resolves to one row, not a duplicate. Change the song/artist after a failed attempt and confirm a different payload does not inherit the previous request’s token.
- [ ] Confirm missing images or unavailable live-stream services do not block song requests or the tip links.
- [ ] Verify the service worker serves only intended cached assets and that a new deployment updates the cache without trapping visitors on stale code.
- [ ] Confirm encoded, double-encoded and malformed private/admin/API paths bypass service-worker caching, while public assets with encoded spaces still cache normally.
- [ ] Confirm query-bearing navigation and static-asset URLs are cached only when the exact URL is pinned in `sw.js` `CORE`; arbitrary token/query parameters and unknown version parameters must bypass Cache Storage.
- [ ] Confirm decoded `.` / `..` path segments cannot traverse into admin, analytics, request-archive or API routes before the offline worker classifies a request.
- [ ] For a future owner-approved release, verify development cache generation `grifflist-livekit-offline-v65` and confirm v64 is retired only after successful activation. Published `main` remains v38 until an explicitly approved deployment.
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


## Booking verification correction — November 12, 2026

A fresh review of the available user-confirmed booking context found no confirmed performance after Hunter’s Ale House on Tuesday, November 10, 2026. The December 3, December 17 and January 1 dates previously entered in the development homepage and this checklist are not supported by a confirmed booking in the available conversation record.

- The December 3, December 17 and January 1 entries have been removed from the development homepage.
- The homepage now states: “Next date to be announced” and “No upcoming performance date is currently confirmed.”
- Do not reinstate a venue, date, performance time, doors time, payment arrangement or stream availability until the user confirms the booking.
- The November 10 checklist remains an archived record; its mobile, request, payment, stream and published-site acceptance items are still incomplete.
- PR #3 remains draft and unpublished. No deployment occurred.
