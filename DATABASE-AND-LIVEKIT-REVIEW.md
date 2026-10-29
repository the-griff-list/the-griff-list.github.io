# Database + LiveKit review notes (v4 review draft)

- `grifflist-combined-reviewed-migration.sql` is a review draft for Watch Live settings, Crowd Favourites, request tracking, and compatibility with the inspected Rockometer/Encore tables. It has NOT been run.
- The migration now has a read-only preflight block inside the transaction. It aborts if the expected admin Auth UID, core `song_requests` columns, or existing Encore RPC signatures/JSONB return types are missing.
- The migration preserves the existing Encore RPC function bodies and execution grants, but sets their `search_path` to empty. Their table and function references are schema-qualified; built-in functions remain available through `pg_catalog`.
- It assumes the inspected `public.song_requests` table includes `song_title`, `artist_name`, `status`, and `created_at`. Existing request rows are not deleted or rewritten. Existing rows without tracking tokens will not be discoverable through the new request-status button.
- `get_my_request_status` relies on the site saving a random tracking token after each successful request submission.
- The Encore voter key is client-generated and is a lightweight duplicate-vote barrier, not strong identity verification; determined users can bypass browser-local limits.
- LiveKit uses the existing Cloudflare Worker token service. The Worker source has `Cache-Control: no-store` on responses and requires `BROADCASTER_PASSWORD` for publisher tokens. Never put LiveKit API secrets or the broadcaster password in browser files or GitHub.
- The admin settings form now starts `session_started_at` when an admin manually transitions the show to live, so the “This Show” Crowd Favourites range can work even if the broadcast controls were not used to set the live state.
- Low-data mode now unsubscribes from remote video tracks instead of merely hiding the video element.
- Homepage Watch Live controls respect the public `show_enabled` setting.
- ZIP integrity and JavaScript syntax checks have been run locally. The live GitHub Pages repository could not be fetched from this environment, and the package has not been tested end-to-end against LiveKit Cloud or executed against the production Supabase database. Compare with the latest live repository before uploading, and test the migration on a safe copy/backup first.
