THE GRIFFLIST — WEBSITE PACKAGE

Current merged review package: v6, based on the user-supplied GitHub repository ZIP dated 2026-10-29.

For safe deployment, start with START-HERE-LIVEKIT.txt, WATCH-LIVE-DEPLOYMENT-GUIDE.md, and GITHUB-BASELINE-MERGE-REPORT-v6.md.

The current Watch Live implementation uses LiveKit Cloud plus cloudflare-livekit-worker.js. Do not use the retained MediaMTX/Caddy/Docker examples for this implementation; they are archived for reference only.

The Supabase migration is a reviewed draft. It has not been executed against production and must be tested against a safe database copy before use. Never commit LiveKit API secrets, the broadcaster password, or a Supabase service-role key.
