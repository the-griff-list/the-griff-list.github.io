# The Grifflist Watch Live — Direct phone-to-website streaming

This package is configured for a phone browser to publish camera + microphone to **MediaMTX over WHIP**, while visitors watch through **WebRTC/WHEP** on `watch-live.html`. The public page reads the venue name and live state from Supabase, overlays the Rock-O-Meter, and links to the existing Ko-fi, PayPal and e-transfer options.

## What is already in the website package

- `admin.html` has the venue name, WHIP/WHEP endpoints, public visibility and LIVE status controls.
- START BROADCAST requests the phone's camera and microphone and publishes to MediaMTX.
- END BROADCAST closes the local stream and marks the show offline.
- `watch-live.html` receives the stream and displays the admin-controlled venue name.
- The Rock-O-Meter overlay reads `rock_meter_settings` from Supabase. Update its goal and confirmed raised amount in the admin panel. **Tips do not automatically change the meter**; automatic totals require verified payment-provider webhooks and should not be faked client-side.
- The existing tipping buttons link to Ko-fi, PayPal and the homepage e-transfer instructions. The site does not collect or verify card details itself.

## Architecture

`Phone camera/mic → HTTPS WHIP → MediaMTX → WebRTC/WHEP → viewers' browsers`

GitHub Pages serves the static website only. It does not host the media relay. MediaMTX is free, open-source software; the server, domain/DNS if used, internet connection, bandwidth and maintenance may cost money.

## One-time setup

1. **Back up the current GitHub Pages repository.** Publish the contents of this update's `grifflist-update` directory to the repository root, preserving existing assets.
2. In Supabase SQL Editor, run `grifflist-next-update.sql` if this version's live settings table is not already installed. Confirm the hard-coded admin UUID in the migration belongs to your actual admin account before running it. Never put a Supabase `service_role` key in website code.
3. On an always-on Linux VPS or a computer on a suitable home connection, install Docker Engine and the Docker Compose plugin.
4. Copy `mediamtx.yml.example` to `mediamtx.yml`, `docker-compose.streaming.yml.example` to `docker-compose.yml`, and `Caddyfile.example` to `Caddyfile`.
5. Replace `stream.example.com` in the MediaMTX and Caddy files with a real hostname. Point its DNS record to the server's public IP. Replace `https://YOUR-USERNAME.github.io` in `mediamtx.yml` with the exact website origin; for a custom website domain, use that origin instead.
6. Replace `REPLACE_WITH_A_LONG_RANDOM_PASSWORD` with a unique password. Do not reuse an email or bank password. The public website must never contain this publisher password.
7. Router/firewall: allow TCP 80 and 443 to Caddy, and UDP 8189 to MediaMTX. Keep MediaMTX's HTTP/WebRTC signaling port 8889 inaccessible directly from the public internet; Caddy proxies the HTTPS signaling requests. If UDP is blocked, WebRTC may need TCP ICE or a TURN relay, which can add latency/cost.
8. From the folder containing the files, run `docker compose up -d`, then inspect `docker compose logs -f`. Verify `https://YOUR-STREAM-HOSTNAME` has a valid TLS certificate before opening camera permissions. The supplied Caddyfile obtains certificates automatically when DNS and ports are correct.
9. Sign into `admin.html` over HTTPS. Enter the venue name, public WHEP URL `https://YOUR-STREAM-HOSTNAME/live/whep`, phone WHIP URL `https://YOUR-STREAM-HOSTNAME/live/whip`, username `publisher`, and the unique password. Enable the public Watch Live page and save.
10. On the phone, allow camera/microphone access and tap START BROADCAST. Keep the tab open and the phone awake. Test `watch-live.html` from a separate device/network, check audio/video and Rock-O-Meter, then tap END BROADCAST.

## Hosting cost planning (CAD estimates, not quotes)

- **Software:** MediaMTX, Docker and Caddy are free/open source.
- **If using an existing home computer:** potentially $0 additional server rental, but electricity, internet, upload speed, router setup and public-IP/CGNAT limitations still apply. A home connection may not allow inbound hosting.
- **If renting a VPS:** budget roughly **C$10–30/month** for a modest starting server, depending on provider, region, CPU/RAM, taxes and billing currency. A very small server may be fine for a private test, but actual concurrency and transcoding needs must be measured. MediaMTX relays rather than transcodes by default.
- **Domain/DNS:** a domain commonly costs an additional annual fee; free dynamic DNS may be adequate for testing. A public hostname and valid HTTPS certificate are required for camera access.
- **Bandwidth is the main variable.** At an illustrative 2.5 Mbps video stream, one viewer uses about 1.1 GB per hour. Ten simultaneous viewers for a one-hour set could use around 11 GB of outbound media, before overhead. Check the provider's included outbound traffic and overage rates. Lowering the broadcast resolution/bitrate can reduce cost but also reduces quality.
- **TURN relay:** not necessarily required, but may be needed when UDP connectivity fails. A relay can materially increase bandwidth costs.
- **No automatic payment-to-meter integration is included.** For accurate automatic tipping totals, integrate verified provider webhooks on a secure backend; do not trust browser-only payment success callbacks.

A reference point for pricing: Hetzner's official June 2026 price adjustment lists some entry-level EU cloud plans starting around US$6.49/month before VAT, but region, availability, bandwidth and suitability vary. That is not a Canada-specific quote. See official pricing notes: https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/ and traffic rules: https://docs.hetzner.com/robot/general/traffic/.

## Safety and privacy

- Tell venue staff and attendees that a live camera is operating; frame the stage and avoid recording private conversations or patrons without appropriate permission.
- Keep the publisher credential private. It is stored in local storage on the admin browser for convenience; use a trusted personal device and clear browser storage if the device is shared.
- The public viewer endpoint is read-only. Do not give visitors publisher credentials.
- Camera/microphone access requires HTTPS. A mobile browser may suspend capture if the screen locks or the tab goes into the background.
- Start with a private test, use headphones to avoid feedback, and verify that the public status changes back to offline when the broadcast ends.

## Troubleshooting

- **Camera/mic prompt missing:** open admin on HTTPS, use a supported mobile browser, grant permissions and close other apps using the camera.
- **WHIP HTTP error:** check `/live/whip`, username/password, Caddy hostname, MediaMTX logs and CORS origin.
- **WHEP viewer won't connect:** check `/live/whep`, HTTPS certificate, `webrtcAllowOrigins`, public hostname in `webrtcAdditionalHosts`, and UDP 8189 firewall/forwarding.
- **Works on same network but not mobile data:** likely public routing, firewall, CGNAT or ICE configuration.
- **Video plays but no audio:** check phone microphone permission, browser track indicators and audio routing. Use the phone preview before going live.
- **Meter absent:** check Supabase connection and whether `rock_meter_settings` contains the expected row; the overlay is hidden if no meter data can be read.
- **Venue not updated:** save the venue in admin and wait up to 15 seconds or reload the public page.

## Important limitation

The bundle supplies the website integration and example server configuration, not a deployed server. Before a real public gig, someone must provision the server, configure DNS/firewall, run the stack, set the correct website origin and credentials, and test from an outside network. Do not announce the stream as operational until that end-to-end test succeeds.
