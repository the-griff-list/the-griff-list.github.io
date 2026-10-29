# The Grifflist LiveKit merge report — v6

## Baseline

Merged against the user-supplied GitHub ZIP `the-griff-list.github.io-main.zip`, downloaded 2026-10-29. The ZIP archive comment identifies source commit `401b9a53222a1853b4e54256730e5c90ed86c7b5`.

## Merge policy

- Preserved all files from the supplied current-site ZIP.
- Overlaid the reviewed LiveKit v5 implementation and its revised SQL migration, while retaining baseline-only media, artwork, notes, and legacy server examples.
- Added `LEGACY-STREAMING-EXAMPLES.txt` to explain that the retained Caddy/MediaMTX/Docker examples are not used by the current LiveKit implementation.
- Added cache-busting query versions to local HTML script and stylesheet references.
- Fixed low-data mode so video tracks are explicitly unsubscribed even when low-data mode is enabled before the stream connects.
- Replaced stale README/upload instructions with LiveKit-specific deployment guidance.
- Bumped the service-worker cache version and included current site audio assets in the offline core cache.
- Kept the standalone migration and `grifflist-combined-reviewed-migration.sql` identical.

## Validation performed locally

- ZIP integrity check.
- Node syntax checks for all bundled JavaScript files.
- LiveKit Worker automated tests using dummy credentials only.
- Local HTML reference check against the merged directory.
- Service-worker precache path check.
- SQL-copy equality check.

## Not claimed as complete

This package has not been deployed to GitHub Pages, the SQL migration has not been run against Supabase, the Cloudflare Worker has not been deployed or verified live, and a real camera/microphone broadcast has not been tested. A production end-to-end test is still required.
