-- Enforce Supabase TOTP MFA (AAL2) for the designated admin at the database layer.
-- IMPORTANT: First enroll and verify an authenticator from admin.html.
-- Then apply this migration. Do not apply before the admin account has a verified factor.
-- Existing RLS policies continue to control who can access each row; these RESTRICTIVE
-- policies add the requirement that the designated admin session be at AAL2.

do $$
declare
  v_table text;
  v_rls_enabled boolean;
  v_tables text[] := array[
    'song_requests',
    'kofi_tips',
    'rock_meter_settings',
    'live_show_settings',
    'crowd_favourite_pins',
    'encore_polls',
    'encore_choices'
  ];
begin
  foreach v_table in array v_tables loop
    if to_regclass('public.' || v_table) is not null then
      select relrowsecurity into v_rls_enabled from pg_class where oid = to_regclass('public.' || v_table);
      if not v_rls_enabled then
        raise exception 'RLS must already be enabled on public.% before adding the admin MFA policy', v_table;
      end if;
      execute format('drop policy if exists admin_requires_aal2 on public.%I', v_table);
      execute format(
        'create policy admin_requires_aal2 on public.%I as restrictive for all to authenticated using ((select auth.uid()) <> %L::uuid or (select auth.jwt() ->> ''aal'') = ''aal2'') with check ((select auth.uid()) <> %L::uuid or (select auth.jwt() ->> ''aal'') = ''aal2'')',
        v_table,
        '7c4c9232-2c28-47f3-a00a-a371ed23cef5',
        '7c4c9232-2c28-47f3-a00a-a371ed23cef5'
      );
    end if;
  end loop;
end;
$$;

-- Verify after applying:
-- SELECT auth.jwt() ->> 'aal';  -- should be aal2 in a verified admin session.
-- Do not weaken or remove the existing table-specific permissive RLS policies.
