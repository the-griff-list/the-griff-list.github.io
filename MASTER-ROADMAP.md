# The Griff List — Official Master Roadmap

**Product vision:** The Griff List is an integrated live-music experience: musician website, song-request platform, live broadcast destination, audience participation hub, tipping/support platform, and rock-themed arcade.

**Engineering principles**
- Preserve working features; inspect before editing.
- Security and privacy before convenience. Never expose Supabase service-role keys or payment credentials in browser code.
- Payment status is trusted only after server-side provider confirmation/webhook processing. A visitor's redirect, form, or self-reported payment is not proof.
- Prefer event-driven updates (Supabase Realtime) over aggressive polling. Use bounded fallbacks only when disconnected.
- Mobile-first, accessible, fast, resilient on weak connections, and usable without autoplay.
- Every change has acceptance criteria and is labelled proposed, implemented, tested, deployed, or blocked. Never claim production readiness without evidence.
- Keep the core experience cohesive; avoid clutter, redundant controls, and novelty that harms usability.

## Phase 1 — Payment infrastructure
- Ko-fi webhook → Supabase tip ledger → authenticated admin tip history is implemented and previously test-inserted; full production payment-to-request matching remains pending SQL migration and end-to-end test.
- Server-generated priority payment references and CAD Ko-fi event matching are implemented in the development branch; database migration has not been applied or tested against production.
- Rollback-only SQL integration tests cover exact CAD matches, under-$5 payments, foreign currency, mismatched references, and the request-specific payment-details RPC. Tests are authored but have not been executed against Supabase.
- Add idempotent, verified CAD tip contribution to Rock-O-Meter; do not silently convert foreign currencies.
- Review and confirm payment providers, business rules, fees, refunds, chargebacks, reconciliation, and manual verification policy.
- PayPal Orders API checkout and signature-verified webhook source are authored in the development branch; sandbox credentials, webhook registration, deployment, and end-to-end tests remain pending. Do not mark PayPal payments verified until a completed capture is verified.
- E-transfer is temporarily disabled on the public website while the user's bank investigates unauthorized Autodeposit destination changes. Do not display the recipient email or accept e-transfer priority selections until the user explicitly re-enables this method.
- Do not connect the website to personal banking credentials or automate bank-app acceptance. Keep e-transfer manual unless a supported, authorized bank/business integration is confirmed.
- Apple Pay / Google Pay are payment methods through a compatible processor, not standalone payout rails; confirm provider and eligibility before implementation.
- Keep priority-request payment status separate from general tips and require verified provider evidence before marking paid.

## Admin experience and business trust
- Stage Mode, persistent on-device preference, instant request search, and request filters are implemented in the development branch.
- Donation terminology replaces visible tip wording; voluntary donations are separated from the paid priority-request add-on.
- A plain-language privacy, terms, donations, and music-rights information page is added. Legal review and accuracy review remain pending.
- Stage Mode and filtering have passed source-level JavaScript syntax checks; actual phone/browser usability testing is still required.

## Phase 2 — Watch Live
- Complete phone-browser WHIP broadcast and viewer WHEP playback against a reachable HTTPS streaming server.
- Validate camera/microphone permissions, reconnect behavior, stream health, mobile battery/network behavior, viewer playback, and graceful shutdown.
- Integrate live viewer experience with song requests and support links.
- Keep credentials server-side or in appropriately protected device storage; never publish broadcaster credentials.

## Phase 3 — Song requests and audience interaction
- Preserve searchable catalog, filters, request tracking, priority requests, played state, archive, and admin inbox.
- Make the admin inbox event-driven using Supabase Realtime, with a 5-second fallback only during disconnection.
- Add request deduplication, clear failure states, and accessible live updates.
- Build crowd favourites, most-requested lists, and show-specific views without exposing requester personal data.

## Phase 4 — Crowd participation
- Improve encore voting, poll lifecycle, vote integrity, and live results.
- Add crowd-favourite pinning and rankings.
- Ensure public aggregates do not expose names, private messages, tracking tokens, or request IDs.
- Test abuse resistance and reset/close behavior for each show.

## Phase 5 — Arcade experience
- Create the Grifflist arcade mode with Guitar Hero-inspired visual language, original interaction design, leaderboards, challenges, Easter eggs, and secret menus.
- Keep it fast, optional, keyboard/touch accessible, and separate from core navigation.
- Use only original or properly licensed audio and assets.

## Phase 6 — Design, performance, accessibility, and discovery
- Maintain coherent 80s rock identity, day/night and seasonal themes where useful.
- Meet WCAG 2.2 AA-oriented accessibility practices: keyboard operation, focus visibility, contrast, labels, reduced motion, captions/transcripts where applicable.
- Optimize Core Web Vitals, image sizes, caching, mobile layout, and low-bandwidth experience.
- Improve metadata, structured data where accurate, search indexing, share previews, and local gig discovery.
- Add privacy-respecting analytics only after purpose, retention, and consent requirements are decided.

## Phase 7 — Security, operations, and business readiness
- Review Supabase RLS policies, Edge Function secrets, webhook verification limits, logs, backups, and recovery.
- Keep secrets out of Git history and client bundles; rotate credentials if exposure is suspected.
- Add monitoring for webhook failures, stream availability, database errors, and deployment health.
- Define privacy/retention rules for supporter messages and request records.
- Test restore procedures, accessibility, browser compatibility, and mobile performance before declaring releases ready.

## Release gates
1. Code review and automated checks pass.
2. SQL migrations are applied and reviewed separately from code deployment.
3. End-to-end tests pass with test data; test payments are removed or clearly marked.
4. Security/privacy checks pass; no privileged keys are present in public assets.
5. Mobile browser smoke tests pass.
6. Production deployment is verified on the live site, with rollback path documented.

## Current implementation notes (2026-11-03)
- Ko-fi webhook endpoint has accepted a Ko-fi test Donation and inserted it into `public.kofi_tips`; the test row was then deleted.
- Initial Ko-fi admin/Rock-O-Meter integration is in draft PR #1 and requires review, SQL migration, deployment, and end-to-end testing.
- Admin request inbox code is being updated to subscribe to `song_requests` via Supabase Realtime; a 5-second fallback is used only if the subscription is disconnected.
- Watch Live code already has WHIP broadcaster and WHEP viewer settings foundations. Actual server reachability and end-to-end streaming remain unverified.
- Payment/business infrastructure still requires explicit owner confirmation before expanding providers or automating verification.
