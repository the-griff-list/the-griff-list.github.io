-- Safe, rollback-only integration test for priority-payment-matching.sql.
-- Run only AFTER kofi-tips-integration.sql and priority-payment-matching.sql.
-- Every test insert is rolled back; no test tips remain in the ledger.

begin;

do $$
declare
  v_token uuid;
  v_ref text;
  v_status text;
  v_wrong_ref text;
  v_usd_ref text;
  v_low_ref text;
begin
  -- Exact CAD Ko-fi match should mark only the referenced request paid.
  v_token := gen_random_uuid();
  insert into public.song_requests
    (requester_name, song_title, artist_name, note, tracking_token)
  values
    ('Payment Test', 'Test Song - Match', 'Test Artist',
     '[PRIORITY TIP PENDING - VERIFY PAYMENT] Method: kofi', v_token)
  returning payment_reference into v_ref;

  if v_ref is null or v_ref !~ '^GRF-[A-F0-9]{12}$' then
    raise exception 'FAIL: priority reference was not generated correctly';
  end if;

  select payment_status into v_status
  from public.song_requests where tracking_token = v_token;
  if v_status <> 'pending' then
    raise exception 'FAIL: new priority request should start pending; got %', v_status;
  end if;

  insert into public.kofi_tips
    (message_id, amount, currency, supporter_name, supporter_message, is_public, payment_type, received_at)
  values
    ('TEST-' || gen_random_uuid()::text, 5.00, 'CAD', 'Payment Test',
     'Priority request ' || v_ref, true, 'Tip', now());

  select payment_status into v_status
  from public.song_requests where tracking_token = v_token;
  if v_status <> 'paid' then
    raise exception 'FAIL: exact CAD Ko-fi reference should mark request paid; got %', v_status;
  end if;

  -- A payment below $5 must not verify a priority request.
  insert into public.song_requests
    (requester_name, song_title, artist_name, note, tracking_token)
  values
    ('Payment Test', 'Test Song - Low Amount', 'Test Artist',
     '[PRIORITY TIP PENDING - VERIFY PAYMENT] Method: kofi', gen_random_uuid())
  returning payment_reference into v_low_ref;

  insert into public.kofi_tips
    (message_id, amount, currency, supporter_name, supporter_message, is_public, payment_type, received_at)
  values
    ('TEST-' || gen_random_uuid()::text, 4.99, 'CAD', 'Payment Test',
     'Priority request ' || v_low_ref, true, 'Tip', now());

  select payment_status into v_status
  from public.song_requests where payment_reference = v_low_ref;
  if v_status <> 'pending' then
    raise exception 'FAIL: payment below $5 must remain pending; got %', v_status;
  end if;

  -- A non-CAD payment must not verify a CAD-denominated priority request.
  insert into public.song_requests
    (requester_name, song_title, artist_name, note, tracking_token)
  values
    ('Payment Test', 'Test Song - Foreign Currency', 'Test Artist',
     '[PRIORITY TIP PENDING - VERIFY PAYMENT] Method: kofi', gen_random_uuid())
  returning payment_reference into v_usd_ref;

  insert into public.kofi_tips
    (message_id, amount, currency, supporter_name, supporter_message, is_public, payment_type, received_at)
  values
    ('TEST-' || gen_random_uuid()::text, 10.00, 'USD', 'Payment Test',
     'Priority request ' || v_usd_ref, true, 'Tip', now());

  select payment_status into v_status
  from public.song_requests where payment_reference = v_usd_ref;
  if v_status <> 'pending' then
    raise exception 'FAIL: non-CAD payment must remain pending; got %', v_status;
  end if;

  -- A valid-looking but unknown reference must not alter any request.
  insert into public.song_requests
    (requester_name, song_title, artist_name, note, tracking_token)
  values
    ('Payment Test', 'Test Song - Wrong Reference', 'Test Artist',
     '[PRIORITY TIP PENDING - VERIFY PAYMENT] Method: kofi', gen_random_uuid())
  returning payment_reference into v_wrong_ref;

  insert into public.kofi_tips
    (message_id, amount, currency, supporter_name, supporter_message, is_public, payment_type, received_at)
  values
    ('TEST-' || gen_random_uuid()::text, 5.00, 'CAD', 'Payment Test',
     'Priority request GRF-FFFFFFFFFFFF', true, 'Tip', now());

  select payment_status into v_status
  from public.song_requests where payment_reference = v_wrong_ref;
  if v_status <> 'pending' then
    raise exception 'FAIL: mismatched reference must remain pending; got %', v_status;
  end if;

  -- The public status RPC must return only the matching request's reference.
  select payment_reference into v_ref
  from public.get_request_payment_details(v_token);
  if v_ref is null then
    raise exception 'FAIL: request payment-details RPC did not return its own reference';
  end if;
  -- A completed PayPal capture should atomically mark the request paid and
  -- increment the Rock-O-Meter exactly once, even if the webhook is replayed.
  declare
    v_paypal_token uuid := gen_random_uuid();
    v_paypal_ref text;
    v_before numeric;
    v_after numeric;
    v_result boolean;
  begin
    select raised_amount into v_before from public.rock_meter_settings where id = 1;
    if not found then raise exception 'FAIL: rock_meter_settings row id=1 is required for meter accounting'; end if;
    insert into public.song_requests
      (requester_name, song_title, artist_name, note, tracking_token)
    values
      ('Payment Test', 'Test Song - PayPal', 'Test Artist',
       '[PRIORITY TIP PENDING - VERIFY PAYMENT] Method: paypal', v_paypal_token)
    returning payment_reference into v_paypal_ref;

    update public.song_requests
       set payment_checkout_reference = 'TEST-ORDER-' || v_paypal_token::text
     where tracking_token = v_paypal_token;

    v_result := public.record_verified_paypal_capture(
      'TEST-CAPTURE-' || v_paypal_token::text,
      'TEST-ORDER-' || v_paypal_token::text,
      v_paypal_ref,
      5.00,
      'CAD'
    );
    if v_result is distinct from true then
      raise exception 'FAIL: valid PayPal capture was not recorded';
    end if;

    select raised_amount into v_after from public.rock_meter_settings where id = 1;
    if v_after <> coalesce(v_before,0) + 5.00 then
      raise exception 'FAIL: Rock-O-Meter should increase by exactly $5.00 once; before %, after %', v_before, v_after;
    end if;

    v_result := public.record_verified_paypal_capture(
      'TEST-CAPTURE-' || v_paypal_token::text,
      'TEST-ORDER-' || v_paypal_token::text,
      v_paypal_ref,
      5.00,
      'CAD'
    );
    select raised_amount into v_after from public.rock_meter_settings where id = 1;
    if v_result is distinct from true or v_after <> coalesce(v_before,0) + 5.00 then
      raise exception 'FAIL: duplicate PayPal capture must be idempotent';
    end if;
  end;

end;
$$;

rollback;
