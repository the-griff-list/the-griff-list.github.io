# LiveKit + Cloudflare Worker setup

This package uses LiveKit Cloud and the Cloudflare Worker token service. It does not use MediaMTX, WHIP, or WHEP. GitHub Pages serves the static website; LiveKit Cloud carries the audio/video stream.

Before going live, deploy `cloudflare-livekit-worker.js` to your existing Cloudflare Worker. Replace the Worker source only after saving a backup of the current version. Never paste secrets into the source file or commit them to GitHub.

Configure these Worker variables/secrets privately:

- `LIVEKIT_API_KEY` (secret)
- `LIVEKIT_API_SECRET` (secret)
- `LIVEKIT_URL` = `wss://the-grifflist-watch-live-2h1716g8.livekit.cloud`
- `BROADCASTER_PASSWORD` (secret; choose a strong unique password)
- `ALLOWED_ORIGIN` = `https://the-griff-list.github.io`

The website requests viewer tokens from `https://odd-unit-91b9.grar0842.workers.dev/token`. Viewer tokens should be subscribe-only. Publisher tokens require the `X-Broadcaster-Password` header. Enter the broadcaster password in the admin page only when you intend to broadcast. Do not commit it to GitHub or put it in public website files.

Test token issuance and a private test stream before setting the show to live. Confirm the deployed Worker matches the included source and that the deployed endpoint is correct. No end-to-end live broadcast test is claimed by this package.
