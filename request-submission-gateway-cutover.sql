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

-- REVOKE INSERT ON TABLE does not remove column-level INSERT grants. The
-- reviewed migration intentionally grants anon/authenticated INSERT on the
-- request-content columns, so remove every column-level grant as well. Derive
-- identifiers from pg_attribute and quote them with format('%I') so schema
-- changes cannot leave a forgotten writable column or inject SQL identifiers.
revoke insert on table public.song_requests from public, anon, authenticated;

do $revoke_column_insert$
declare
  v_columns text;
begin
  select pg_catalog.string_agg(
    pg_catalog.format('%I', a.attname),
    ', ' order by a.attnum
  )
  into v_columns
  from pg_catalog.pg_attribute as a
  join pg_catalog.pg_class as t on t.oid = a.attrelid
  join pg_catalog.pg_namespace as n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'song_requests'
    and a.attnum > 0
    and not a.attisdropped;

  if v_columns is null then
    raise exception 'Cutover blocked: public.song_requests has no visible columns.';
  end if;

  execute pg_catalog.format(
    'revoke insert (%s) on table public.song_requests from public, anon, authenticated',
    v_columns
  );
end;
$revoke_column_insert$;

-- Fail the transaction if any public-facing role can still INSERT any column,
-- whether through a table grant, a column grant, or a privilege inherited from
-- PUBLIC. This is the actual cutover postcondition, not just a text-level intent.
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
