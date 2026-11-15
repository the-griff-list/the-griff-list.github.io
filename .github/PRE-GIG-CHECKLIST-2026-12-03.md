# December 3, 2026 — Hunter’s Ale House pre-gig website checklist

**Confirmed next booking:** Hunter’s Ale House · Thursday, December 3, 2026 · planned performance window 10:00 p.m.–1:30 a.m. Atlantic.  
**Following confirmed booking:** Hunter’s Ale House · Thursday, December 17, 2026 · planned performance window 10:00 p.m.–1:30 a.m. Atlantic.  
**Booking confirmation:** the user confirmed both Hunter’s dates and the performance window in the October 30, 2026 conversation. November 13 was not booked.  
**Status:** active development-only checklist. PR #3 remains draft and unpublished; no deployment is authorized.

## Correction to the previous archive label

An earlier version of this file incorrectly marked December 3 and December 17 as unverified based on an assistant-generated summary. A fresh retrieval of the user’s October 30 conversation found direct confirmation of both Hunter’s Ale House dates and the 10:00 p.m.–1:30 a.m. planned performance window. This checklist is therefore active for December 3. Do not infer doors time, cover charge, set count, payment arrangement, recording permission or stream availability.

## Before December 3

- [ ] Confirm the homepage and Tour Roadmap display Thursday, December 3 as the next show and December 17 as the following confirmed show.
- [ ] Verify the venue name and planned performance window are readable at 320, 360, 375, 390 and 430 CSS-pixel viewport widths.
- [ ] Verify the song catalogue loads, search works, and tapping a song selects it for the request form.
- [ ] Exercise request validation, idempotent retry and failure states through automated/mock tests only; do not submit a fabricated live request to the production database.
- [ ] Verify the optional priority-request wording remains optional and its payment/fulfilment instructions are accurate.
- [ ] Open the existing Ko-fi and PayPal destinations and verify their labels. Do not add wallet badges or imply Apple Pay/Google Pay availability is guaranteed.
- [ ] Verify the live page presents an honest offline/not-live state when no stream is configured. Do not advertise a stream or recording.
- [ ] Verify offline mode clearly distinguishes the cached catalogue from network-dependent requests, tips and live video; do not imply requests are queued offline.
- [ ] Check keyboard-only navigation, visible focus, skip link, accessible form names, validation announcements and reduced-motion behavior.
- [ ] Validate every navigation link, image, stylesheet, script, manifest and service-worker asset used by the homepage and Tour Roadmap.
- [ ] Re-run the exact-head website quality workflow after these date edits. The earlier 137-pass/1-skip run [#43696107553](https://github.com/the-griff-list/the-griff-list.github.io/actions/runs/43696107553) passed on the previous code head; it does not qualify the new date-change commits.
- [ ] Review the published-site service-worker v38 cache/privacy issue separately. Development v67 is not live and no deployment/cache purge is authorized.

## Show information rules

- Advertise only the confirmed venue, date and planned performance window above.
- The 10:00 p.m.–1:30 a.m. window is the planned performance time, not a doors time.
- Do not add a cover charge, age restriction, guest lineup, set count, break schedule, recording permission, livestream promise or payment guarantee without direct confirmation.
- Keep the existing payment destinations and request flow unchanged.
- Do not merge PR #3, publish the site, deploy the request Worker, run the Supabase cutover migration or alter production settings without explicit owner approval.

## Acceptance and release gate

This checklist is not complete merely because automated CI passes. Mark an item only after its stated evidence exists. The December 3 website experience is ready for the gig only after the relevant mobile, accessibility, request, payment-instruction, offline and link checks are completed against the exact draft head. Published-site deployment remains a separate owner-approved action.
