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

-- PostgreSQL table-level REVOKE also removes the corresponding column-level
-- grants on that table. The postcondition below checks effective privileges
-- across every live column, including grants inherited through other roles or
-- PUBLIC, and aborts the transaction if any public-facing INSERT path remains.
revoke insert on table public.song_requests from public, anon, authenticated;

do $verify_no_public_insert$
declare
  v_remaining_columns text;
begin
  select pg_catalog.string_agg(a.attname::text, ', ' order by a.attnum)
  into v_remaining_columns
  from pg_catalog.pg_attribute as a
  join pg_catalog.pg_class as t on t.oid = a.attrelid
  join pg_catalog.pg_namespace as n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'song_requests'
    and a.attnum > 0
    and not a.attisdropped
    and (
      pg_catalog.has_column_privilege('anon', t.oid, a.attname, 'INSERT')
      or pg_catalog.has_column_privilege('authenticated', t.oid, a.attname, 'INSERT')
    );

  if v_remaining_columns is not null then
    raise exception
      'Cutover blocked: direct INSERT remains for anon/authenticated on columns: %',
      v_remaining_columns;
  end if;
end;
$verify_no_public_insert$;

commit;
