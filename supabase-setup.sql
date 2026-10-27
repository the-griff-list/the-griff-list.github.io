-- Run this in Supabase Dashboard > SQL Editor after creating your project.
create table if not exists public.song_requests (
  id bigint generated always as identity primary key,
  requester_name text not null check (char_length(requester_name) between 1 and 100),
  song_title text not null check (char_length(song_title) between 1 and 200),
  artist_name text check (artist_name is null or char_length(artist_name) <= 200),
  note text check (note is null or char_length(note) <= 1500),
  status text not null default 'New' check (status in ('New', 'Played', 'Completed', 'Declined')),
  created_at timestamptz not null default now()
);
alter table public.song_requests enable row level security;

-- Anyone can submit a request, but anonymous visitors cannot read or change requests.
drop policy if exists "Anyone can submit a song request" on public.song_requests;
create policy "Anyone can submit a song request"
  on public.song_requests for insert to anon, authenticated
  with check (
    char_length(requester_name) between 1 and 100 and
    char_length(song_title) between 1 and 200 and
    (artist_name is null or char_length(artist_name) <= 200) and
    (note is null or char_length(note) <= 1500) and
    status = 'New'
  );

-- Only signed-in users can read/update. Create only your own admin login and disable public sign-ups.
drop policy if exists "Admin can read song requests" on public.song_requests;
create policy "Admin can read song requests"
  on public.song_requests for select to authenticated using (true);
drop policy if exists "Admin can update song requests" on public.song_requests;
create policy "Admin can update song requests"
  on public.song_requests for update to authenticated using (true) with check (true);
