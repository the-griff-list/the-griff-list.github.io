# Public song-request gateway — draft deployment plan

**Status: prototype only. Not deployed. Do not run either SQL file against production yet.**

This is a separate Cloudflare Worker for public song-request submissions. It does not modify the existing LiveKit token Worker.

## Components

- `cloudflare-request-gateway.js`: accepts bounded JSON at `POST /submit`, enforces exact-origin CORS, requires Cloudflare edge client metadata, checks a Turnstile token server-side, and calls two service-role-only Postgres RPCs.
- `request-submission-gateway-migration.sql`: adds a private HMAC-digest quota table and atomic RPCs. It intentionally leaves the current direct anonymous INSERT grant in place during staging.
- `request-submission-gateway-cutover.sql`: separate, explicit cutover migration that revokes direct table INSERT from public roles. Do not run it until the deployed Worker and browser integration have passed acceptance.
- `tests/cloudflare-request-gateway.test.mjs`: deterministic Node tests with mocked Supabase and Siteverify responses.

## Security model

1. The Worker must be the first Cloudflare edge handler for the browser request. It reads only `CF-Connecting-IP`; it never falls back to `X-Forwarded-For`. Cloudflare documents that this header is added on edge-to-origin traffic, and that same-zone Worker subrequests can have different client-IP semantics. Do not place this Worker behind another same-zone Worker that forwards user-controlled IP headers.
2. The raw client address is HMAC-SHA-256 hashed with a private Worker secret. Only the 64-character digest is sent to Postgres and retained in quota buckets; old buckets are cleaned in bounded batches after seven days. This is pseudonymous rate-limit data, not anonymous data.
3. Turnstile tokens are checked with the server-side Siteverify endpoint. The Worker checks success, exact hostname, and action `song_request`. It does not pass the raw client IP to Siteverify. Tokens are not logged or stored.
4. The attempt RPC allows 20 attempts per source per minute. Accepted requests are limited to 5 per source per 10 minutes and 200 globally per day. These are conservative initial configuration values, not validated demand limits; tune them after observing legitimate use.
5. The submit RPC checks the tracking token before quotas, compares all request fields for same-token retries, and inserts atomically. Reusing a token with different content returns a conflict. A concurrent duplicate insert rolls back quota increments before returning idempotent success.
6. Both RPCs are SECURITY DEFINER with an empty search path, fully qualified table/function references, and execute permission limited to `service_role`. The private quota table is not directly accessible to public roles.
7. Backend, challenge, and configuration failures fail closed. The Worker never falls back to direct anonymous database insertion.

## Required Worker variables and secrets

Configure privately in Cloudflare; never put values in this repository:

| Name | Type | Purpose |
|---|---|---|
| `ALLOWED_ORIGIN` | Variable | Exact origin `https://the-griff-list.github.io` |
| `SUPABASE_URL` | Variable | Existing project HTTPS URL |
| `TURNSTILE_EXPECTED_HOSTNAME` | Variable | `the-griff-list.github.io` |
| `SUPABASE_SECRET_KEY` | Secret | Server-only Supabase secret/service-role key |
| `TURNSTILE_SECRET_KEY` | Secret | Turnstile Siteverify secret |
| `RATE_LIMIT_HMAC_SECRET` | Secret | At least 32 random bytes; used only to derive source digests |

The public Turnstile site key and Worker endpoint belong in the browser config only after the Worker is deployed and tested. Never expose the Supabase secret key or HMAC secret. The Worker requires a new Supabase sb_secret_ key and sends it only in the apikey header; do not send the opaque key as Authorization: Bearer. The configured project URL is restricted to an HTTPS project-ref.supabase.co hostname.

## Important edge-rate-limit limitation

The database quotas are strict for requests that reach the RPCs, but they do not prevent a volumetric flood from invoking the Worker before its code runs. Add and verify an upstream Cloudflare WAF/rate-limiting control before public cutover. Cloudflare's Worker Rate Limiting binding is approximate and location-local; Cloudflare documents Durable Objects as the strict cross-location option. Do not assume a free plan includes the required WAF feature or enable a paid feature without owner approval.

## Staged rollout

1. Create a Turnstile widget restricted to the exact GitHub Pages hostname, with action `song_request`. Record the public site key; keep the secret private.
2. Create a separate Worker from `cloudflare-request-gateway.js`; configure the variables/secrets above. Do not replace the existing LiveKit Worker.
3. Apply `request-submission-gateway-migration.sql` only to a disposable/staging Supabase project first. Review grants, function owners, RLS behavior, quotas, cleanup, duplicate races, and PostgREST RPC responses.
4. Deploy the Worker to a staging endpoint and verify direct edge ingress supplies a real Cloudflare `CF-Connecting-IP`. Do not test trust by sending a spoofed header from a local client and assuming it is authentic.
5. Verify Turnstile hostname/action, invalid/replayed token rejection, per-source attempt limit, per-source accepted limit, global daily cap, same-token retry, changed-content conflict, malformed/oversized body rejection, and fail-closed backend outage.
6. Add an upstream edge rate-limit rule and verify it applies before Worker invocation. If this cannot be done within an approved plan, public cutover remains blocked.
7. Configure `requestGatewayUrl` and `turnstileSiteKey` in the development browser config and run the desktop/Android-size/iPhone browser suite. An empty gateway URL deliberately preserves the existing direct-Supabase path during staging; once a gateway URL is set, errors must not fall back to direct INSERT.
8. Only after the endpoint is deployed and end-to-end verified, review and apply `request-submission-gateway-cutover.sql` to revoke direct public INSERT. The cutover file is separate and is not run by CI.
9. Keep a tested rollback procedure ready. Restoring direct INSERT is a database permission change and requires owner approval; do not automate it.

## Acceptance and current limitations

- Node unit tests exercise Worker request validation, trusted-header selection, HMAC pseudonymization, Turnstile failure/replay, rate-limit responses, idempotent retry, and backend outages.
- No Deno/Supabase local stack, PostgreSQL migration execution, staging database, Cloudflare Worker deployment, Turnstile widget, WAF rule, production secret, or live browser integration is configured yet.
- No direct anonymous INSERT privilege has been revoked.
- The public request form remains on the existing direct Supabase path until a non-empty, valid HTTPS gateway URL and public Turnstile site key are deliberately configured.
