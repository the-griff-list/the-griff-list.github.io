-- Hardening follow-up for an already-installed request archive trigger.
-- Apply after request-archive-migration.sql in the Supabase SQL Editor.
-- This changes only the function's execution search_path; it does not alter request data.
begin;

alter function public.archive_song_request()
  set search_path = '';

revoke all on function public.archive_song_request() from public;

commit;
