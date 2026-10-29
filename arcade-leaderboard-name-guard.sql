-- Optional defense-in-depth for Guitar Pick Panic leaderboard names.
-- Review before running in Supabase SQL Editor. This rejects a practical starter list;
-- it cannot detect every offensive phrase or every language and is not a substitute for moderation.
create or replace function public.grifflist_arcade_name_is_allowed(p_name text)
returns boolean
language sql immutable
as $$
  select length(trim(coalesce(p_name, ''))) between 2 and 24
    and trim(coalesce(p_name, '')) ~ '[[:alpha:]]'
    and lower(coalesce(p_name, '')) !~* '(^|[^a-z])(mike[[:space:]]*hunt|gabe[[:space:]]*owners?|rock[[:space:]]*star|asshole|arsehole|bastard|bitch|blowjob|bullshit|cock|cocksucker|cunt|dickhead|dick|dildo|fag|faggot|fuck[a-z]*|motherfucker|nigger|nonce|piss|porn|prick|rape|retard|shag|shit[a-z]*|slut|spunk|twat|wanker|whore)([^a-z]|$)';
$$;

create or replace function public.grifflist_guard_arcade_leaderboard_name()
returns trigger language plpgsql
as $$
begin
  if not public.grifflist_arcade_name_is_allowed(new.player_name) then
    raise exception 'Please choose a respectful leaderboard name.' using errcode = '23514';
  end if;
  new.player_name := trim(regexp_replace(new.player_name, '\s+', ' ', 'g'));
  return new;
end;
$$;

drop trigger if exists arcade_leaderboard_name_guard on public.arcade_leaderboard;
create trigger arcade_leaderboard_name_guard
before insert or update of player_name on public.arcade_leaderboard
for each row execute function public.grifflist_guard_arcade_leaderboard_name();
