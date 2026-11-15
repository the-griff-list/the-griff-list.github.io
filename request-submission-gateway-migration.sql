-- DRAFT ONLY: install private quota/idempotency RPCs for the Cloudflare request gateway.
-- This migration deliberately does NOT revoke the existing anonymous INSERT grant/policy.
-- Do not run against production until staged, the Worker is deployed, and acceptance passes.

begin;

do $preflight$
begin
  if pg_catalog.to_regclass('public.song_requests') is null then
    raise exception 'Preflight failed: public.song_requests does not exist.';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='song_requests' and column_name='requester_name')
     or not exists (select 1 from information_schema.columns where table_schema='public' and table_name='song_requests' and column_name='song_title')
     or not exists (select 1 from information_schema.columns where table_schema='public' and table_name='song_requests' and column_name='artist_name')
     or not exists (select 1 from information_schema.columns where table_schema='public' and table_name='song_requests' and column_name='note')
     or not exists (select 1 from information_schema.columns where table_schema='public' and table_name='song_requests' and column_name='tracking_token') then
    raise exception 'Preflight failed: public.song_requests is missing a required request column.';
  end if;
end;
$preflight$;

create schema if not exists grifflist_private;
revoke all on schema grifflist_private from public, anon, authenticated;

create table if not exists grifflist_private.request_submission_limits (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  hit_count integer not null check (hit_count > 0),
  updated_at timestamptz not null
);
revoke all on table grifflist_private.request_submission_limits from public, anon, authenticated, service_role;
create index if not exists request_submission_limits_updated_at_idx
  on grifflist_private.request_submission_limits (updated_at);

create unique index if not exists song_requests_tracking_token_unique
  on public.song_requests (tracking_token)
  where tracking_token is not null;

-- Internal atomic fixed-window counter. Only SECURITY DEFINER RPCs call this.
create or replace function grifflist_private.consume_bucket(
  p_bucket_key text, p_limit integer, p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_started_at timestamptz;
  v_hit_count integer;
  v_window interval := pg_catalog.make_interval(secs => p_window_seconds);
begin
  if p_limit < 1 or p_limit > 10000 or p_window_seconds < 1 or p_window_seconds > 604800 then
    raise exception 'Invalid quota parameters.';
  end if;

  insert into grifflist_private.request_submission_limits as current_bucket
    (bucket_key, window_started_at, hit_count, updated_at)
  values (p_bucket_key, v_now, 1, v_now)
  on conflict (bucket_key) do update
    set window_started_at = case
          when current_bucket.window_started_at + v_window <= v_now then v_now
          else current_bucket.window_started_at
        end,
        hit_count = case
          when current_bucket.window_started_at + v_window <= v_now then 1
          else current_bucket.hit_count + 1
        end,
        updated_at = v_now
    where current_bucket.window_started_at + v_window <= v_now
       or current_bucket.hit_count < p_limit
  returning window_started_at, hit_count
    into v_window_started_at, v_hit_count;

  if not found then
    select current_bucket.window_started_at into v_window_started_at
    from grifflist_private.request_submission_limits as current_bucket
    where current_bucket.bucket_key = p_bucket_key;
    return query select false,
      case
        when v_window_started_at is null then 1
        when pg_catalog.ceil(pg_catalog.date_part('epoch', (v_window_started_at + v_window - v_now)))::integer < 1 then 1
        else pg_catalog.ceil(pg_catalog.date_part('epoch', (v_window_started_at + v_window - v_now)))::integer
      end;
    return;
  end if;
  return query select true, 0;
end;
$function$;
revoke all on function grifflist_private.consume_bucket(text, integer, integer)
  from public, anon, authenticated, service_role;

-- Coarse per-IP attempt cap before Siteverify: 120 attempts per minute.
-- This high ceiling is only an abuse-attempt guard; it avoids a low per-IP cap
-- blocking many legitimate patrons behind shared venue Wi-Fi/mobile NAT.
-- The key is a Worker-generated HMAC digest; raw IP addresses are never stored.
create or replace function public.consume_request_submission_attempt(p_ip_hash text)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_quota record;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}
    raise exception 'Invalid source digest.';
  end if;

  -- Bounded cleanup: at most 100 expired buckets per request.
  delete from grifflist_private.request_submission_limits as stale
  where stale.ctid in (
    select candidate.ctid
    from grifflist_private.request_submission_limits as candidate
    where candidate.updated_at < pg_catalog.clock_timestamp() - interval '7 days'
    order by candidate.updated_at
    limit 100
  );

  select * into v_quota
  from grifflist_private.consume_bucket('attempt:ip:' || p_ip_hash, 120, 60);
  return query select v_quota.allowed, v_quota.retry_after_seconds;
end;
$function$;
revoke all on function public.consume_request_submission_attempt(text) from public, anon, authenticated;
grant execute on function public.consume_request_submission_attempt(text) to service_role;

-- Accepted-request quota is keyed by HMAC(IP + per-tab random session ID),
-- so patrons sharing one public IP do not consume one another's allowance.
-- Atomic accepted-request quota + idempotent insert. Same-token/same-content retries
-- return success without consuming another accepted-request slot.
create or replace function public.submit_song_request_once(
  p_source_hash text,
  p_requester_name text,
  p_song_title text,
  p_artist_name text,
  p_note text,
  p_tracking_token uuid
)
returns table (accepted boolean, duplicate boolean, reason text, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_existing public.song_requests%rowtype;
  v_quota record;
begin
  if p_source_hash is null or p_source_hash !~ '^[0-9a-f]{64}$'
     or p_tracking_token is null
     or p_requester_name is null or pg_catalog.char_length(pg_catalog.btrim(p_requester_name)) not between 1 and 100
     or p_song_title is null or pg_catalog.char_length(pg_catalog.btrim(p_song_title)) not between 1 and 200
     or (p_artist_name is not null and pg_catalog.char_length(pg_catalog.btrim(p_artist_name)) > 200)
     or (p_note is not null and pg_catalog.char_length(p_note) > 1500) then
    raise exception 'Invalid song request.';
  end if;

  select * into v_existing
  from public.song_requests as existing_request
  where existing_request.tracking_token = p_tracking_token;
  if found then
    if v_existing.requester_name = pg_catalog.btrim(p_requester_name)
       and v_existing.song_title = pg_catalog.btrim(p_song_title)
       and v_existing.artist_name is not distinct from nullif(pg_catalog.btrim(coalesce(p_artist_name, '')), '')
       and v_existing.note is not distinct from nullif(pg_catalog.btrim(coalesce(p_note, '')), '') then
      return query select true, true, 'duplicate'::text, 0;
    else
      return query select false, false, 'idempotency_conflict'::text, 0;
    end if;
    return;
  end if;

  -- Quota increments and INSERT share a subtransaction. A concurrent unique-token
  -- race rolls the increments back before returning idempotent success.
  begin
    select * into v_quota
    from grifflist_private.consume_bucket('accepted:source:' || p_source_hash, 5, 600);
    if not v_quota.allowed then
      return query select false, false, 'source_limit'::text, v_quota.retry_after_seconds;
      return;
    end if;

    select * into v_quota
    from grifflist_private.consume_bucket('accepted:global', 200, 86400);
    if not v_quota.allowed then
      return query select false, false, 'global_limit'::text, v_quota.retry_after_seconds;
      return;
    end if;

    insert into public.song_requests
      (requester_name, song_title, artist_name, note, tracking_token)
    values (
      pg_catalog.btrim(p_requester_name),
      pg_catalog.btrim(p_song_title),
      nullif(pg_catalog.btrim(coalesce(p_artist_name, '')), ''),
      nullif(pg_catalog.btrim(coalesce(p_note, '')), ''),
      p_tracking_token
    );
  exception when unique_violation then
    select * into v_existing
    from public.song_requests as existing_request
    where existing_request.tracking_token = p_tracking_token;
    if found
       and v_existing.requester_name = pg_catalog.btrim(p_requester_name)
       and v_existing.song_title = pg_catalog.btrim(p_song_title)
       and v_existing.artist_name is not distinct from nullif(pg_catalog.btrim(coalesce(p_artist_name, '')), '')
       and v_existing.note is not distinct from nullif(pg_catalog.btrim(coalesce(p_note, '')), '') then
      return query select true, true, 'duplicate'::text, 0;
    else
      return query select false, false, 'idempotency_conflict'::text, 0;
    end if;
    return;
  end;

  return query select true, false, 'accepted'::text, 0;
end;
$function$;
revoke all on function public.submit_song_request_once(text, text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.submit_song_request_once(text, text, text, text, text, uuid)
  to service_role;

commit;
 then
    raise exception 'Invalid source digest.';
  end if;

  -- Bounded cleanup: at most 100 expired buckets per request.
  delete from grifflist_private.request_submission_limits as stale
  where stale.ctid in (
    select candidate.ctid
    from grifflist_private.request_submission_limits as candidate
    where candidate.updated_at < pg_catalog.clock_timestamp() - interval '7 days'
    order by candidate.updated_at
    limit 100
  );

  select * into v_quota
  from grifflist_private.consume_bucket('attempt:' || p_source_hash, 20, 60);
  return query select v_quota.allowed, v_quota.retry_after_seconds;
end;
$function$;
revoke all on function public.consume_request_submission_attempt(text) from public, anon, authenticated;
grant execute on function public.consume_request_submission_attempt(text) to service_role;

-- Atomic accepted-request quota + idempotent insert. Same-token/same-content retries
-- return success without consuming another accepted-request slot.
create or replace function public.submit_song_request_once(
  p_source_hash text,
  p_requester_name text,
  p_song_title text,
  p_artist_name text,
  p_note text,
  p_tracking_token uuid
)
returns table (accepted boolean, duplicate boolean, reason text, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_existing public.song_requests%rowtype;
  v_quota record;
begin
  if p_source_hash is null or p_source_hash !~ '^[0-9a-f]{64}$'
     or p_tracking_token is null
     or p_requester_name is null or pg_catalog.char_length(pg_catalog.btrim(p_requester_name)) not between 1 and 100
     or p_song_title is null or pg_catalog.char_length(pg_catalog.btrim(p_song_title)) not between 1 and 200
     or (p_artist_name is not null and pg_catalog.char_length(pg_catalog.btrim(p_artist_name)) > 200)
     or (p_note is not null and pg_catalog.char_length(p_note) > 1500) then
    raise exception 'Invalid song request.';
  end if;

  select * into v_existing
  from public.song_requests as existing_request
  where existing_request.tracking_token = p_tracking_token;
  if found then
    if v_existing.requester_name = pg_catalog.btrim(p_requester_name)
       and v_existing.song_title = pg_catalog.btrim(p_song_title)
       and v_existing.artist_name is not distinct from nullif(pg_catalog.btrim(coalesce(p_artist_name, '')), '')
       and v_existing.note is not distinct from nullif(pg_catalog.btrim(coalesce(p_note, '')), '') then
      return query select true, true, 'duplicate'::text, 0;
    else
      return query select false, false, 'idempotency_conflict'::text, 0;
    end if;
    return;
  end if;

  -- Quota increments and INSERT share a subtransaction. A concurrent unique-token
  -- race rolls the increments back before returning idempotent success.
  begin
    select * into v_quota
    from grifflist_private.consume_bucket('accepted:source:' || p_source_hash, 5, 600);
    if not v_quota.allowed then
      return query select false, false, 'source_limit'::text, v_quota.retry_after_seconds;
      return;
    end if;

    select * into v_quota
    from grifflist_private.consume_bucket('accepted:global', 200, 86400);
    if not v_quota.allowed then
      return query select false, false, 'global_limit'::text, v_quota.retry_after_seconds;
      return;
    end if;

    insert into public.song_requests
      (requester_name, song_title, artist_name, note, tracking_token)
    values (
      pg_catalog.btrim(p_requester_name),
      pg_catalog.btrim(p_song_title),
      nullif(pg_catalog.btrim(coalesce(p_artist_name, '')), ''),
      nullif(pg_catalog.btrim(coalesce(p_note, '')), ''),
      p_tracking_token
    );
  exception when unique_violation then
    select * into v_existing
    from public.song_requests as existing_request
    where existing_request.tracking_token = p_tracking_token;
    if found
       and v_existing.requester_name = pg_catalog.btrim(p_requester_name)
       and v_existing.song_title = pg_catalog.btrim(p_song_title)
       and v_existing.artist_name is not distinct from nullif(pg_catalog.btrim(coalesce(p_artist_name, '')), '')
       and v_existing.note is not distinct from nullif(pg_catalog.btrim(coalesce(p_note, '')), '') then
      return query select true, true, 'duplicate'::text, 0;
    else
      return query select false, false, 'idempotency_conflict'::text, 0;
    end if;
    return;
  end;

  return query select true, false, 'accepted'::text, 0;
end;
$function$;
revoke all on function public.submit_song_request_once(text, text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.submit_song_request_once(text, text, text, text, text, uuid)
  to service_role;

commit;
