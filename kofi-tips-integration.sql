-- Ko-fi tip integration for The Grifflist
-- Run once in the Supabase SQL Editor. No service-role key is exposed to the browser.

-- Only signed-in dashboard users may read individual tip records.
grant select on table public.kofi_tips to authenticated;
drop policy if exists "Dashboard users can read Ko-fi tips" on public.kofi_tips;
create policy "Dashboard users can read Ko-fi tips"
on public.kofi_tips for select to authenticated
using (auth.role() = 'authenticated');

-- Automatically add CAD-denominated tips to the existing Rock-O-Meter.
-- Other currencies remain visible in the admin tip history but are not
-- converted into CAD without a trusted exchange-rate source.
create or replace function public.add_kofi_tip_to_rockometer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if upper(new.currency) = 'CAD' then
    update public.rock_meter_settings
       set raised_amount = coalesce(raised_amount, 0) + new.amount,
           updated_at = now()
     where id = 1;
  end if;
  return new;
end;
$$;

drop trigger if exists kofi_tip_updates_rockometer on public.kofi_tips;
create trigger kofi_tip_updates_rockometer
after insert on public.kofi_tips
for each row execute function public.add_kofi_tip_to_rockometer();

-- Keep direct anonymous access blocked; the public website reads only the
-- aggregate Rock-O-Meter settings already exposed by its existing setup.
revoke all on table public.kofi_tips from anon;
