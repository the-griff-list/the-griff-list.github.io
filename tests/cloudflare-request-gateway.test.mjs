import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import { createRequestGatewayHandler } from "../cloudflare-request-gateway.js";

const ORIGIN = "https://the-griff-list.github.io";
const TRACKING_TOKEN = "2d3b4f86-0f12-4a4e-9f6b-1b47e1f0c1a2";
const IP = "203.0.113.10";

function env(overrides = {}) {
  return {
    ALLOWED_ORIGIN: ORIGIN,
    SUPABASE_URL: "https://wgoepotvblksgjogougo.supabase.co",
    SUPABASE_SECRET_KEY: "sb_secret_test_only_not_a_real_key",
    TURNSTILE_SECRET_KEY: "turnstile-test-secret",
    TURNSTILE_EXPECTED_HOSTNAME: "the-griff-list.github.io",
    RATE_LIMIT_HMAC_SECRET: "test-only-hmac-secret-at-least-32-characters-long",
    ...overrides,
  };
}
function payload(overrides = {}) {
  return {
    requester_name: "Test Listener",
    song_title: "Summer of 69",
    artist_name: "Bryan Adams",
    note: "Please play this one!",
    tracking_token: TRACKING_TOKEN,
    turnstile_token: "turnstile-token-1",
    ...overrides,
  };
}
function request(body = payload(), headers = {}) {
  return new Request("https://requests.example.workers.dev/submit", {
    method: "POST",
    headers: { Origin: ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": IP, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
function response(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
}
function mockFetch({ attempt = [{ allowed: true, retry_after_seconds: 0 }],
  challenge = { success: true, hostname: "the-griff-list.github.io", action: "song_request" },
  submission = [{ accepted: true, duplicate: false, reason: "accepted", retry_after_seconds: 0 }],
  fail = null } = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (fail === "attempt" && String(url).includes("consume_request_submission_attempt")) return response({}, 503);
    if (fail === "challenge" && String(url).includes("siteverify")) return response({}, 503);
    if (fail === "submit" && String(url).includes("submit_song_request_once")) return response({}, 503);
    if (String(url).includes("consume_request_submission_attempt")) return response(attempt);
    if (String(url).includes("siteverify")) {
      return response(typeof challenge === "function"
        ? challenge(calls.filter(call => call.url.includes("siteverify")).length) : challenge);
    }
    if (String(url).includes("submit_song_request_once")) return response(submission);
    throw new Error("Unexpected fetch URL: " + url);
  };
  return { fetchImpl, calls };
}
function handler(mock) {
  return createRequestGatewayHandler({ fetchImpl: mock.fetchImpl, cryptoImpl: webcrypto });
}

test("accepts a valid request and returns only its tracking token", async () => {
  const mock = mockFetch();
  const result = await handler(mock)(request(), env());
  assert.equal(result.status, 201);
  assert.deepEqual(await result.json(), { ok: true, duplicate: false, tracking_token: TRACKING_TOKEN });
  assert.equal(mock.calls.length, 3);
  assert.ok(mock.calls[0].url.endsWith("/rpc/consume_request_submission_attempt"));
  assert.ok(mock.calls[1].url.includes("challenges.cloudflare.com/turnstile/v0/siteverify"));
  assert.ok(mock.calls[2].url.endsWith("/rpc/submit_song_request_once"));
});

test("rejects missing and foreign origins before backend access", async () => {
  const mock = mockFetch();
  const run = handler(mock);
  assert.equal((await run(request(payload(), { Origin: "" }), env())).status, 403);
  assert.equal((await run(request(payload(), { Origin: "https://evil.example" }), env())).status, 403);
  assert.equal(mock.calls.length, 0);
});
test("handles exact-origin preflight and rejects unsupported methods", async () => {
  const mock = mockFetch();
  const run = handler(mock);
  const preflight = await run(new Request("https://requests.example.workers.dev/submit", {
    method: "OPTIONS", headers: { Origin: ORIGIN },
  }), env());
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  assert.match(preflight.headers.get("Access-Control-Allow-Methods"), /POST/);
  const get = await run(new Request("https://requests.example.workers.dev/submit", {
    method: "GET", headers: { Origin: ORIGIN },
  }), env());
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("Allow"), "POST, OPTIONS");
  assert.equal(mock.calls.length, 0);
});


test("ignores spoofed X-Forwarded-For and requires Cloudflare client metadata", async () => {
  const mock = mockFetch();
  const result = await handler(mock)(request(payload(), { "CF-Connecting-IP": "", "X-Forwarded-For": "198.51.100.9" }), env());
  assert.equal(result.status, 400);
  assert.equal(mock.calls.length, 0);
});

test("uses only a keyed source digest and never forwards raw IP to Siteverify", async () => {
  const mock = mockFetch();
  const result = await handler(mock)(request(payload(), { "X-Forwarded-For": "198.51.100.9" }), env());
  assert.equal(result.status, 201);
  const attemptBody = JSON.parse(mock.calls[0].options.body);
  assert.equal(mock.calls[0].options.headers.apikey, env().SUPABASE_SECRET_KEY);
  assert.equal(Object.hasOwn(mock.calls[0].options.headers, "Authorization"), false);
  assert.match(attemptBody.p_source_hash, /^[0-9a-f]{64}$/);
  assert.equal(attemptBody.p_source_hash.includes(IP), false);
  const challengeBody = JSON.parse(mock.calls[1].options.body);
  assert.equal(Object.hasOwn(challengeBody, "remoteip"), false);
  assert.equal(JSON.stringify(mock.calls).includes(IP), false);
});

test("rejects malformed and oversized bodies before backend access", async () => {
  const mock = mockFetch();
  const run = handler(mock);
  assert.equal((await run(request("{not-json"), env())).status, 400);
  assert.equal((await run(request("x".repeat(9000)), env())).status, 413);
  assert.equal(mock.calls.length, 0);
});

test("rejects overlong fields and client-controlled status fields", async () => {
  const mock = mockFetch();
  const run = handler(mock);
  assert.equal((await run(request(payload({ requester_name: "x".repeat(101) })), env())).status, 400);
  assert.equal((await run(request(payload({ status: "Played" })), env())).status, 400);
  assert.equal(mock.calls.length, 0);
});

test("rejects source attempts over the strict database limit before Siteverify", async () => {
  const mock = mockFetch({ attempt: [{ allowed: false, retry_after_seconds: 37 }] });
  const result = await handler(mock)(request(), env());
  assert.equal(result.status, 429);
  assert.equal(result.headers.get("Retry-After"), "37");
  assert.equal(mock.calls.length, 1);
});

test("rejects invalid, wrong-host and wrong-action Turnstile tokens", async () => {
  for (const challenge of [
    { success: false, hostname: "the-griff-list.github.io", action: "song_request" },
    { success: true, hostname: "evil.example", action: "song_request" },
    { success: true, hostname: "the-griff-list.github.io", action: "other_action" },
  ]) {
    const mock = mockFetch({ challenge });
    const result = await handler(mock)(request(), env());
    assert.equal(result.status, 403);
    assert.equal(mock.calls.some(call => call.url.endsWith("/rpc/submit_song_request_once")), false);
  }
});

test("replayed Turnstile token is rejected by Siteverify and never inserts twice", async () => {
  const mock = mockFetch({
    challenge: count => count === 1
      ? { success: true, hostname: "the-griff-list.github.io", action: "song_request" }
      : { success: false, hostname: "the-griff-list.github.io", action: "song_request", "error-codes": ["timeout-or-duplicate"] },
  });
  const run = handler(mock);
  assert.equal((await run(request(), env())).status, 201);
  assert.equal((await run(request(), env())).status, 403);
  assert.equal(mock.calls.filter(call => call.url.endsWith("/rpc/submit_song_request_once")).length, 1);
});

test("enforces the global accepted-request cap after challenge validation", async () => {
  const mock = mockFetch({ submission: [{ accepted: false, duplicate: false, reason: "global_limit", retry_after_seconds: 43200 }] });
  const result = await handler(mock)(request(), env());
  assert.equal(result.status, 429);
  assert.equal(result.headers.get("Retry-After"), "43200");
  assert.deepEqual(await result.json(), { error: "daily_request_limit_reached" });
});

test("same-token retry returns idempotent success", async () => {
  const mock = mockFetch({ submission: [{ accepted: true, duplicate: true, reason: "duplicate", retry_after_seconds: 0 }] });
  const result = await handler(mock)(request(), env());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: true, duplicate: true, tracking_token: TRACKING_TOKEN });
});

test("backend and challenge outages fail closed without direct database fallback", async () => {
  const backend = mockFetch({ fail: "attempt" });
  assert.equal((await handler(backend)(request(), env())).status, 503);
  assert.equal(backend.calls.length, 1);
  const challenge = mockFetch({ fail: "challenge" });
  assert.equal((await handler(challenge)(request(), env())).status, 503);
  assert.equal(challenge.calls.some(call => call.url.endsWith("/rpc/submit_song_request_once")), false);
});

test("missing secrets, wrong Supabase host or malformed configuration fail closed", async () => {
  const mock = mockFetch();
  assert.equal((await handler(mock)(request(), env({ RATE_LIMIT_HMAC_SECRET: "short" }))).status, 503);
  assert.equal((await handler(mock)(request(), env({ SUPABASE_URL: "https://attacker.example" }))).status, 503);
  assert.equal((await handler(mock)(request(), env({ SUPABASE_SECRET_KEY: "sb_publishable_not_secret" }))).status, 503);
  assert.equal(mock.calls.length, 0);
});

test("draft SQL keeps the legacy insert path until explicit cutover", async () => {
  const migration = await readFile(new URL("../request-submission-gateway-migration.sql", import.meta.url), "utf8");
  const cutover = await readFile(new URL("../request-submission-gateway-cutover.sql", import.meta.url), "utf8");
  assert.match(migration, /create or replace function public\.consume_request_submission_attempt/i);
  assert.match(migration, /create or replace function public\.submit_song_request_once/i);
  assert.match(migration, /grant execute on function public\.submit_song_request_once[\s\S]*to service_role/i);
  assert.doesNotMatch(migration, /revoke insert on table public\.song_requests from public, anon, authenticated/i);
  assert.match(cutover, /revoke insert on table public\.song_requests from public, anon, authenticated/i);
  assert.match(migration, /set search_path = ''/i);
});

 
test("browser config keeps the gateway disabled and contains no server secrets", async () => {
  const config = await readFile(new URL("../supabase-config.js", import.meta.url), "utf8");
  assert.match(config, /requestGatewayUrl:\s*""/);
  assert.match(config, /turnstileSiteKey:\s*""/);
  assert.doesNotMatch(config, /SUPABASE_SECRET_KEY|TURNSTILE_SECRET_KEY|RATE_LIMIT_HMAC_SECRET/);
});
