-- The Grifflist Premium Insights: privacy-conscious event collection.
-- Run once in Supabase SQL Editor. No IP address, email, name, or precise location is stored.
begin;
create table if not exists public.site_analytics_events (
 id bigint generated always as identity primary key,
 event_name text not null check (length(event_name) between 1 and 60),
 page_path text not null check (length(page_path) <= 180),
 visitor_id text not null check (length(visitor_id) between 1 and 80),
 session_id text not null check (length(session_id) between 1 and 80),
 device_type text not null check (device_type in ('mobile','desktop','tablet')),
 referrer_domain text not null default '' check (length(referrer_domain) <= 180),
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists site_analytics_events_created_idx on public.site_analytics_events(created_at desc);
create index if not exists site_analytics_events_event_idx on public.site_analytics_events(event_name,created_at desc);
create index if not exists site_analytics_events_visitor_idx on public.site_analytics_events(visitor_id,created_at desc);
alter table public.site_analytics_events enable row level security;
drop policy if exists "Public can submit analytics events" on public.site_analytics_events;
create policy "Public can submit analytics events" on public.site_analytics_events for insert to anon, authenticated with check (
 length(event_name) between 1 and 60 and length(page_path)<=180 and length(visitor_id) between 1 and 80 and length(session_id) between 1 and 80 and device_type in ('mobile','desktop','tablet') and length(referrer_domain)<=180 and jsonb_typeof(metadata)='object'
);
drop policy if exists "Admin can read analytics events" on public.site_analytics_events;
create policy "Admin can read analytics events" on public.site_analytics_events for select to authenticated using (auth.uid() = '7c4c9232-2c28-47f3-a00a-a371ed23cef5'::uuid);
grant insert on public.site_analytics_events to anon, authenticated;
grant select on public.site_analytics_events to authenticated;
grant usage, select on sequence public.site_analytics_events_id_seq to anon, authenticated;
commit;
