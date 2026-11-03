# PayPal priority-payment integration

This integration is prepared in source but is **not deployed or enabled**. Test in PayPal Sandbox first. Do not paste API credentials into GitHub, chat, or browser code.

## Official PayPal references

- [Orders API integration](https://developer.paypal.com/whats-an-order/)
- [Subscribe to checkout webhooks](https://developer.paypal.com/payment-methods/webhooks/)
- [Webhook signature verification](https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature_post)

## What it does

1. The public request form saves a priority request and receives its server-generated `GRF-XXXXXXXXXXXX` reference.
2. For PayPal priority requests, the browser invokes `paypal-create-order` with the request's unguessable tracking token.
3. The Edge Function looks up the request server-side and confirms it is pending and specifically assigned to PayPal. The amount is fixed server-side at CAD $5.00.
4. PayPal receives the generated reference as `custom_id` for reconciliation.
5. PayPal sends `CHECKOUT.ORDER.APPROVED`; the webhook verifies the signature, checks the matching pending request and order details, then captures the approved order.
6. PayPal sends `PAYMENT.CAPTURE.COMPLETED`; the webhook verifies the signature and completed capture, then marks the matching request paid.
7. The admin inbox receives the database update through the existing Realtime subscription.

A browser redirect, approval event alone, customer statement, or unverified webhook never marks a request paid.

## Required Supabase migration

Apply, in order:

1. `kofi-tips-integration.sql`
2. `admin-realtime-inbox.sql`
3. `priority-payment-matching.sql`

The third migration adds `payment_checkout_reference`, which the PayPal checkout flow needs. Then run `priority-payment-matching-tests.sql`.

## Deploy functions

From the repository root with the Supabase CLI installed:

```sh
supabase login
supabase link --project-ref wgoepotvblksgjogougo
supabase functions deploy paypal-create-order --no-verify-jwt
supabase functions deploy paypal-webhook --no-verify-jwt
```

Both functions deliberately use `--no-verify-jwt` because the public request form uses a tracking-token capability and PayPal's webhook uses PayPal's own signature verification. The create-order function only accepts an unguessable request tracking token and re-checks the request, payment method, and pending status server-side. The webhook verifies every notification against PayPal's verification API before acting.

## Configure secrets

Create a REST API app in PayPal Developer Dashboard. Start in Sandbox. Add these Supabase Edge Function secrets through the Supabase Dashboard or CLI:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com`

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. If they are not present in the project environment, set them through Supabase Secrets. Never place the service-role key in the website.

After deploying `paypal-webhook`, register this URL in the PayPal Sandbox REST app:

`https://wgoepotvblksgjogougo.supabase.co/functions/v1/paypal-webhook`

Subscribe to:

- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`

The webhook ID shown by PayPal must be stored as `PAYPAL_WEBHOOK_ID`.

## Sandbox acceptance tests

- Valid pending PayPal request creates a CAD $5.00 order.
- The order contains the exact server-generated reference in `custom_id`.
- Repeated create-order calls reuse the existing CREATED order.
- A forged webhook signature is rejected.
- An APPROVED event for an unknown order/reference does not trigger capture.
- A valid APPROVED event triggers capture once (idempotency key is used).
- Only a verified COMPLETED capture for the same order, reference, CAD currency, and amount of at least $5 marks the request paid.
- A pending, denied, wrong-currency, underpaid, unrelated, or duplicate event does not mark another request paid.
- The admin inbox updates to show PayPal as the verified provider.

## Current limitations

- This code has not been deployed or tested against PayPal Sandbox.
- PayPal API credentials and webhook ID have not been configured.
- The existing PayPal general-tip link remains unchanged; this integration applies only to the $5 priority-request flow.
- Refunds, chargebacks, disputes, and payment reversals need a separate reconciliation workflow before production use.
- Do not switch to Live until all Sandbox acceptance tests pass.
