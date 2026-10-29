-- Optional one-time cleanup for the known inappropriate/test leaderboard entries.
-- Review before running in Supabase. This only removes exact matching names.
DELETE FROM public.arcade_leaderboard
WHERE lower(trim(player_name)) IN ('gabe owners', 'gabe owner', 'mike hunt', 'rock star');
