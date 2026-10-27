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

-- Only the designated admin account can read or update requests.
-- Admin account UID: 7c4c9232-2c28-47f3-a00a-a371ed23cef5
drop policy if exists "Admin can read song requests" on public.song_requests;
create policy "Admin can read song requests"
  on public.song_requests for select to authenticated
  using (auth.uid() = '7c4c9232-2c28-47f3-a00a-a371ed23cef5'::uuid);
drop policy if exists "Admin can update song requests" on public.song_requests;
create policy "Admin can update song requests"
  on public.song_requests for update to authenticated
  using (auth.uid() = '7c4c9232-2c28-47f3-a00a-a371ed23cef5'::uuid)
  with check (auth.uid() = '7c4c9232-2c28-47f3-a00a-a371ed23cef5'::uuid);


-- Allow only the designated admin account to delete individual requests.
drop policy if exists "Admin can delete song requests" on public.song_requests;
create policy "Admin can delete song requests"
  on public.song_requests for delete to authenticated
  using (auth.uid() = '7c4c9232-2c28-47f3-a00a-a371ed23cef5'::uuid);
