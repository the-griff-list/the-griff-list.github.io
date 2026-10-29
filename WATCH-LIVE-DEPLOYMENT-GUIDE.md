# The Grifflist — LiveKit Watch Live Deployment Guide

This version uses the existing **LiveKit Cloud** project and the Cloudflare Worker token service. It does **not** use MediaMTX, WHIP, or WHEP. GitHub Pages serves the static website; LiveKit Cloud carries the audio/video stream.

## Components

- `watch-live.html` + `live-show.js`: public viewer; requests a viewer-only token from the Cloudflare Worker.
- `admin.html` + `admin-features.js`: admin controls and phone broadcaster; requests a publisher token after the broadcaster password is checked by the Worker.
- `cloudflare-livekit-worker.js`: signs short-lived LiveKit tokens. LiveKit API credentials must remain in Worker secrets.
- `grifflist-combined-reviewed-migration.sql`: review draft for Watch Live settings, Crowd Favourites, request tracking, Rockometer, and Encore Vote.

## Before deploying

1. Back up/download the currently published GitHub Pages repository.
2. Compare this package with the current repository before copying files. This package may not include the very latest visual-only changes. Do not blindly replace the entire site if you need to preserve newer edits.
3. Open the SQL migration and confirm the hardcoded admin UUID (`7c4c9232-2c28-47f3-a00a-a371ed23cef5`) is your actual Supabase Auth user ID. Confirm the live schema matches the assumptions. The migration has not been run or tested against the production database. It includes a preflight guard for the inspected admin UID, song-request columns, and Encore RPC signatures, but this is not a substitute for testing against a safe copy.
4. Test the migration in a non-production Supabase project or after taking a suitable backup. Do not run it until reviewed.

## Cloudflare Worker

The worker is configured in the included source for the existing endpoint:

`https://odd-unit-91b9.grar0842.workers.dev/token`

Required Worker environment variables/secrets:

- `LIVEKIT_API_KEY` — secret
- `LIVEKIT_API_SECRET` — secret
- `LIVEKIT_URL` — `wss://the-grifflist-watch-live-2h1716g8.livekit.cloud`
- `BROADCASTER_PASSWORD` — choose a strong, unique secret
- `ALLOWED_ORIGIN` — `https://the-griff-list.github.io`

Replace the Worker source with `cloudflare-livekit-worker.js` only after reviewing it. Set the variables/secrets in Cloudflare's dashboard; never put the API secret or broadcaster password in GitHub or browser JavaScript. The Worker checks the configured origin and only issues publisher tokens when the correct password is provided. Viewer tokens are short-lived and cannot publish.

The website JavaScript has the Worker URL hardcoded in `live-show.js` and `admin-features.js`. If the Worker URL changes, update both files. The viewer includes a tap-to-enable-audio fallback for browsers that block autoplay; viewers should tap it if they see video but hear no sound.

## Safe rollout order

1. Keep the public Watch Live button hidden while configuring and testing.
2. Deploy the Worker source and configure the secrets/variables.
3. Test `POST /token` with `{ "role": "viewer" }`; verify the response contains `token` and `serverUrl`. Never share the token publicly.
4. Test publisher token issuance only from the admin workflow using the configured broadcaster password. Do not publish the password.
5. Apply the reviewed SQL only after checking the admin UUID and schema. This SQL does not configure LiveKit credentials.
6. Publish only the needed website files after comparing against the current repository and preserving newer assets/changes.
7. For a real playback test, temporarily enable Watch Live and mark the show live. This briefly makes the Watch Live button visible to the public; do this only when you are ready for a public test, or use a separate staging project for a fully private test.
8. Sign in to `admin.html` over HTTPS, enter the broadcaster password, and tap **START BROADCAST**. Allow camera/microphone access and keep the page open and phone awake.
9. Open `watch-live.html` on a second device, confirm video and audio (tap **Tap to enable live audio** if prompted), then end the broadcast and confirm the page returns offline.
10. Turn the public Watch Live setting off after the test. Enable it again only when ready for a real show.

## Database features included in the migration draft

- `live_show_settings` for venue/show state
- `crowd_favourite_pins` and `get_crowd_favourites`
- `song_requests.tracking_token` and `get_my_request_status`
- `rock_meter_settings`
- `encore_polls`, `encore_choices`, `encore_votes`, `get_active_encore_poll`, and `cast_encore_vote`

The migration assumes `public.song_requests` already exists with `song_title`, `artist_name`, `status`, and `created_at`. Existing request rows are not deleted or rewritten. Existing rows without tracking tokens won't be discoverable through the new request-status button.

## v5 offline fixes and local checks

- The service-worker cache list now references the real `grifflist-logo.webp` asset, includes `taxi-services.html`, and uses a new cache version. The previous missing logo path could cause the entire precache operation to fail.
- Cache lookup ignores query strings so versioned script/style URLs can use cached base assets when offline.
- The Cloudflare Worker now rejects unknown roles and invalid/missing LiveKit configuration. Run `node tests/cloudflare-livekit-worker.test.mjs` with Node.js to test the Worker locally using dummy credentials.

## Limitations and safety notes

- No end-to-end stream test has been run against your actual LiveKit project from this package review. A syntax check is not a live-stream test.
- Encore duplicate-vote prevention uses a browser-generated voter key and is a lightweight barrier, not strong identity verification.
- The Rockometer is manually maintained in the admin page; tips do not automatically increase the amount.
- Check the administrator UUID before running SQL. The same hardcoded UUID appears in the existing database setup and the new policies, but this does not independently prove it matches your account.
- Do not expose a Supabase service-role key, LiveKit API secret, or broadcaster password in public files.
