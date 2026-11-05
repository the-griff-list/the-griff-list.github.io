-- Hardening follow-up for an already-installed request archive trigger.
-- Apply after request-archive-migration.sql in the Supabase SQL Editor.
-- This hardens the function search_path and removes unnecessary direct EXECUTE grants; it does not alter request data.
begin;

alter function public.archive_song_request()
  set search_path = '';

-- Supabase also grants function EXECUTE directly to Data API roles by default.
-- The existing trigger remains attached; only its owner needs direct EXECUTE privilege.
revoke execute on function public.archive_song_request() from public, anon, authenticated, service_role;

commit;
