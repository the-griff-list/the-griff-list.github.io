# Admin dashboard and release qualification checklist

This checklist defines the release gate for the Stage Control dashboard. Source-level checks are not a substitute for testing on the actual phone, browser, Supabase project, and streaming server.

## Stage Control — live-use workflow

- [ ] Sign in from the phone browser on the same device used on stage.
- [ ] Enable Stage Mode; reload the page and confirm the preference persists.
- [ ] Confirm the main screen shows only the request queue, search/filter controls, show status, and Go Live / End Live / Refresh actions.
- [ ] Confirm the advanced settings panel is hidden in Stage Mode and accessible after exiting it.
- [ ] Search by song title, artist, and requester; confirm results update immediately.
- [ ] Filter New, Played, Priority / payment, and All requests.
- [ ] Confirm the empty-state message appears when filters return no results.
- [ ] Mark a song Played and unmark it; confirm the change persists after refresh.
- [ ] Verify request deletion requires confirmation and removes only the selected request.
- [ ] Confirm priority payment badges distinguish pending, reported, manually verified, Ko-fi verified, and PayPal verified states.
- [ ] Confirm the payment reference and provider are visible only in the admin dashboard.
- [ ] Confirm refresh, realtime updates, and fallback refresh do not create duplicate cards or lose filters.
- [ ] Test with one hand, at arm's length, in bright stage lighting, on a narrow mobile screen.
- [ ] Verify no critical action requires hover, drag, tiny controls, or precise tapping.

## Show controls

- [ ] Confirm Go Live requests camera and microphone permission only after the button is pressed.
- [ ] Confirm the status changes to LIVE only after the WHIP connection is established and the database update succeeds.
- [ ] Confirm End Live closes the WHIP session, stops camera/microphone tracks, and updates the database.
- [ ] Test lost Wi-Fi, mobile-data switching, denied permissions, server errors, and browser backgrounding.
- [ ] Confirm a stale LIVE flag can be corrected from the admin dashboard.

## Security and privacy

- [ ] Enroll an authenticator TOTP factor and verify a successful challenge.
- [ ] Sign out and confirm the next login requires the authenticator code.
- [ ] Apply `admin-mfa-enforcement.sql` only after the factor is verified.
- [ ] Confirm the designated admin's AAL1 database requests are denied for protected tables and AAL2 requests work.
- [ ] Confirm non-admin public request submission and public read-only features still work.
- [ ] Confirm no service-role key, PayPal secret, webhook token, or authenticator secret appears in client assets or logs.
- [ ] Confirm admin data is not exposed to anonymous visitors or other authenticated users.

## Payment qualification

- [ ] Apply the reviewed SQL migrations in the documented order.
- [ ] Execute `priority-payment-matching-tests.sql` and verify rollback.
- [ ] Test a valid Ko-fi CAD payment with the exact reference.
- [ ] Test wrong currency, underpayment, missing reference, unknown reference, duplicate event, and unrelated donation.
- [ ] Verify Rock-O-Meter increments exactly once for each verified CAD donation.
- [ ] Configure PayPal Sandbox credentials and webhook ID; deploy both Edge Functions.
- [ ] Test valid order approval and completed capture, invalid signature, wrong amount/currency, duplicate webhook, cancelled order, and replay.
- [ ] Verify only a completed, signature-verified capture marks a PayPal request paid.
- [ ] Confirm the existing PayPal general donation link still works independently.
- [ ] Keep e-transfer disabled until the user explicitly re-enables it after bank security review.

## Accessibility, performance, and trust

- [ ] Check keyboard navigation and visible focus.
- [ ] Check text contrast, zoom to 200%, screen-reader labels, and reduced-motion preferences.
- [ ] Confirm touch targets are large and separated enough for use on stage.
- [ ] Test on current Android Chrome and desktop Chrome/Firefox/Safari.
- [ ] Test slow mobile data and a temporary offline/reconnect cycle.
- [ ] Confirm no fake urgency, preselected donations, hidden charges, or misleading wallet badges.
- [ ] Confirm donation wording is separate from the paid priority-request add-on.
- [ ] Confirm legal/privacy page reflects actual data handling and provider configuration.
- [ ] Confirm SOCAN/Entandem and online-stream licensing responsibilities with the venues and relevant rights holders.

## Release decision

The site is **not release-qualified** until all critical boxes above are completed and the database, payment, authentication, live-stream, and mobile workflows pass. Record each test with date, device/browser, result, and any defect. Do not describe the product as 100% ready based on source inspection alone.
