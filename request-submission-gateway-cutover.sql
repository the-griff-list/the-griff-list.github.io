-- DRAFT CUTOVER ONLY. Do not run until the Cloudflare request Worker is deployed
-- and its hostname/action, quota, idempotency, outage, and browser retry tests pass.
-- This removes direct public table inserts; status lookup remains available through its RPC.

begin;

do $preflight$
begin
  if pg_catalog.to_regprocedure('public.consume_request_submission_attempt(text)') is null
     or pg_catalog.to_regprocedure('public.submit_song_request_once(text,text,text,text,text,uuid)') is null then
    raise exception 'Cutover blocked: request gateway RPCs are not installed.';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'song_requests'
      and indexname = 'song_requests_tracking_token_unique'
  ) then
    raise exception 'Cutover blocked: tracking-token unique index is missing.';
  end if;
end;
$preflight$;

revoke insert on table public.song_requests from public, anon, authenticated;

commit;
