# December 3, 2026 — Hunter's Ale House pre-gig website checklist

**Booking:** Thursday, December 3, 2026 · Hunter's Ale House · 10:00 p.m.–1:30 a.m. Atlantic. This is the user-confirmed performance window, not a venue doors time.

**Status:** Prepared, not yet executed. Development-only. Website PR #3 remains draft; nothing is deployed.

**Development head at preparation:** `795dd1cfeba2359bf49eaca3e303481747f079b9`

## Acceptance checklist

### Show information
- [ ] Homepage shows December 3 as the next confirmed performance with the correct Atlantic performance window.
- [ ] Tour Roadmap lists December 3, December 17 and January 1 accurately.
- [ ] No doors time, venue terms or additional dates are inferred.
- [ ] The archived November 10 checklist remains historical and is not marked complete retroactively.

### Mobile, accessibility and navigation
- [ ] Test 320, 360, 390 and 430 CSS-pixel viewport widths; no horizontal overflow or clipped primary controls.
- [ ] Test keyboard-only navigation, visible focus, skip link, headings, landmarks, form labels and live status announcements.
- [ ] Test enlarged text and reduced-motion settings.
- [ ] Verify every top-level link, roadmap anchor, contact link, Watch Live link and Sober Drive link.
- [ ] Confirm touch targets remain usable on a phone and the song catalogue does not require opening the on-screen keyboard just to browse.

### Song catalogue and requests
- [ ] Load the catalogue; test song search, artist filter, decade filters and empty results.
- [ ] Tap a song and verify title/artist populate the request form correctly.
- [ ] Test random song, required name/song validation, optional note and request confirmation.
- [ ] Test last-request status without exposing another person's request or private identifiers.
- [ ] Verify remembered-name storage is opt-in and the opt-out path clears the saved name.
- [ ] Confirm offline requests are not queued or represented as sent.

### Tips and priority requests
- [ ] Confirm Ko-fi and PayPal links point to the existing approved destinations and open safely.
- [ ] Confirm e-transfer remains visibly unavailable while its security review is pending.
- [ ] Confirm the optional $5 CAD priority-request choice is explicit and never triggers an automatic charge.
- [ ] Verify Apple Pay / Google Pay wording remains conditional on the provider checkout actually offering those methods.
- [ ] Do not alter payment destinations, credentials, checkout configuration or live payment flows during this checklist.
- [ ] Test only provider sandbox flows where already configured; do not make a real payment.

### Offline, streaming and privacy
- [ ] Test offline and poor-network states; the public catalogue may be available, but requests, tips, checkout and live video must clearly require a connection.
- [ ] Verify the public service-worker shell does not cache admin, analytics, request-archive or Supabase configuration assets.
- [ ] Test Watch Live with no broadcast available; no broken or misleading live controls.
- [ ] Do not claim phone-browser streaming or physical-device broadcast reliability without a real device test.
- [ ] Confirm no private data or payment identifiers appear in public pages, logs or cached responses.

### Final qualification
- [ ] Run exact-head HTML/reference, JavaScript, CSS, image, manifest and service-worker checks.
- [ ] Run desktop Chromium, Android-size Chromium and iPhone WebKit browser qualification.
- [ ] Manually test the development site on a physical phone and record browser/device details.
- [ ] Recheck all payment destinations and show information immediately before the performance.
- [ ] Obtain explicit deployment approval before any publication; keep PR #3 draft until then.

## Evidence log

| Item | Result / evidence |
|---|---|
| Development commit | To be recorded after checklist updates |
| PR #3 | Draft; not deployed |
| Automated CI | To be recorded |
| Physical phone | Not yet tested |
| Payment sandbox | Not yet tested |
| Live stream | Not yet tested |
| Outstanding blockers | Runner availability, physical-device qualification, publication approval |

**Day-of reminder:** Verify the network and the actual show setup before promising requests, checkout or live streaming. Keep a local/offline setlist backup; do not treat the website as the only performance workflow.
