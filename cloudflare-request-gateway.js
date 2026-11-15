// Draft Cloudflare Worker for The Grifflist public song-request gateway.
// Separate from cloudflare-livekit-worker.js. No secrets belong in source control.
const MAX_BODY_BYTES = 8192;
const TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SOURCE_HASH_CONTEXT = "grifflist-request-source-v1:";
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(status, payload, origin, allowedOrigin, extraHeaders = {}) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  if (origin && origin === allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "600");
  }
  return new Response(payload === null ? null : JSON.stringify(payload), { status, headers });
}

function validHttpsOrigin(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.origin === value &&
      parsed.pathname === "/" && !parsed.search && !parsed.hash;
  } catch { return false; }
}

function validSupabaseUrl(value) {
  try {
    const base = String(value).replace(/\\/+$/, "");
    const parsed = new URL(base);
    return parsed.protocol === "https:" &&
      /^[a-z0-9-]+\\.supabase\\.co$/i.test(parsed.hostname) &&
      parsed.origin === base && parsed.pathname === "/";
  } catch { return false; }
}

function validIpLiteral(value) {
  if (typeof value !== "string" || !value || value !== value.trim() || /[%\s,]/.test(value)) return false;
  if (value.includes(":")) {
    try {
      const parsed = new URL("http://[" + value + "]/");
      return parsed.hostname.startsWith("[") && parsed.pathname === "/" && parsed.port === "";
    } catch { return false; }
  }
  const parts = value.split(".");
  return parts.length === 4 && parts.every(part =>
    /^(0|[1-9][0-9]{0,2})$/.test(part) && Number(part) <= 255
  );
}

async function readBoundedJson(request, maxBytes = MAX_BODY_BYTES) {
  const contentLength = request.headers.get("Content-Length");
  if (contentLength !== null && (!/^[0-9]+$/.test(contentLength) || Number(contentLength) > maxBytes)) {
    throw Object.assign(new Error("body_too_large"), { status: 413 });
  }
  if (!request.body) throw Object.assign(new Error("empty_body"), { status: 400 });
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw Object.assign(new Error("body_too_large"), { status: 413 });
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let decoded;
  try { decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw Object.assign(new Error("invalid_utf8"), { status: 400 }); }
  try { return JSON.parse(decoded); }
  catch { throw Object.assign(new Error("invalid_json"), { status: 400 }); }
}

function codePointLength(value) { return Array.from(value).length; }

function validateRequestPayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "invalid_payload" };
  const allowed = new Set(["requester_name", "song_title", "artist_name", "note", "tracking_token", "turnstile_token"]);
  if (Object.keys(input).some(key => !allowed.has(key))) return { error: "unexpected_field" };
  const requesterName = typeof input.requester_name === "string" ? input.requester_name.trim() : "";
  const songTitle = typeof input.song_title === "string" ? input.song_title.trim() : "";
  const artistName = input.artist_name == null ? "" : typeof input.artist_name === "string" ? input.artist_name.trim() : null;
  const note = input.note == null ? "" : typeof input.note === "string" ? input.note.trim() : null;
  const trackingToken = typeof input.tracking_token === "string" ? input.tracking_token.toLowerCase() : "";
  const turnstileToken = typeof input.turnstile_token === "string" ? input.turnstile_token.trim() : "";
  if (!requesterName || codePointLength(requesterName) > 100) return { error: "invalid_requester_name" };
  if (!songTitle || codePointLength(songTitle) > 200) return { error: "invalid_song_title" };
  if (artistName === null || (artistName && codePointLength(artistName) > 200)) return { error: "invalid_artist_name" };
  if (note === null || codePointLength(note) > 1500) return { error: "invalid_note" };
  if (!UUID_V4.test(trackingToken)) return { error: "invalid_tracking_token" };
  if (!turnstileToken || turnstileToken.length > 2048) return { error: "invalid_challenge_token" };
  return { value: {
    requester_name: requesterName, song_title: songTitle, artist_name: artistName || null,
    note: note || null, tracking_token: trackingToken, turnstile_token: turnstileToken,
  }};
}

async function hmacHex(secret, message, cryptoImpl) {
  const encoder = new TextEncoder();
  const key = await cryptoImpl.subtle.importKey("raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await cryptoImpl.subtle.sign("HMAC", key, encoder.encode(message)));
  return Array.from(signature, byte => byte.toString(16).padStart(2, "0")).join("");
}

function firstRow(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value && typeof value === "object" ? value : null;
}

export function createRequestGatewayHandler({ fetchImpl = globalThis.fetch, cryptoImpl = globalThis.crypto } = {}) {
  return async function handleRequest(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env?.ALLOWED_ORIGIN || "";
    if (!validHttpsOrigin(allowedOrigin) || !validSupabaseUrl(env?.SUPABASE_URL) ||
        typeof env?.SUPABASE_SECRET_KEY !== "string" || !env.SUPABASE_SECRET_KEY.startsWith("sb_secret_") ||
        !env?.TURNSTILE_SECRET_KEY || !env?.TURNSTILE_EXPECTED_HOSTNAME ||
        new URL(allowedOrigin).hostname !== env.TURNSTILE_EXPECTED_HOSTNAME ||
        typeof env?.RATE_LIMIT_HMAC_SECRET !== "string" || env.RATE_LIMIT_HMAC_SECRET.length < 32) {
      return jsonResponse(503, { error: "request_service_unavailable" }, origin, allowedOrigin);
    }
    if (origin !== allowedOrigin) return jsonResponse(403, { error: "origin_not_allowed" }, origin, allowedOrigin);
    const url = new URL(request.url);
    if (url.pathname !== "/submit") return jsonResponse(404, { error: "not_found" }, origin, allowedOrigin);
    if (request.method === "OPTIONS") return jsonResponse(204, null, origin, allowedOrigin);
    if (request.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" }, origin, allowedOrigin, { Allow: "POST, OPTIONS" });
    if ((request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase() !== "application/json") {
      return jsonResponse(415, { error: "content_type_must_be_json" }, origin, allowedOrigin);
    }

    let body;
    try { body = await readBoundedJson(request); }
    catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : 400;
      return jsonResponse(status, { error: status === 413 ? "request_too_large" : "invalid_request" }, origin, allowedOrigin);
    }
    const validated = validateRequestPayload(body);
    if (validated.error) return jsonResponse(400, { error: validated.error }, origin, allowedOrigin);

    // Cloudflare injects CF-Connecting-IP on direct edge ingress. Never fall
    // back to client-controlled X-Forwarded-For or another forwarded-IP field.
    const clientIp = request.headers.get("CF-Connecting-IP") || "";
    if (!validIpLiteral(clientIp)) return jsonResponse(400, { error: "trusted_client_address_required" }, origin, allowedOrigin);
    let sourceHash;
    try { sourceHash = await hmacHex(env.RATE_LIMIT_HMAC_SECRET, SOURCE_HASH_CONTEXT + clientIp, cryptoImpl); }
    catch { return jsonResponse(503, { error: "request_service_unavailable" }, origin, allowedOrigin); }

    const supabaseBase = String(env.SUPABASE_URL).replace(/\/+$/, "");
    const supabaseHeaders = {
      "Content-Type": "application/json",
      // Supabase opaque secret keys belong in apikey, not Authorization: Bearer.
      apikey: env.SUPABASE_SECRET_KEY,
    };
    const callRpc = async (name, payload) => {
      const response = await fetchImpl(supabaseBase + "/rest/v1/rpc/" + name, {
        method: "POST", headers: supabaseHeaders, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(7000),
      });
      if (!response.ok) throw new Error("backend_unavailable");
      return response.json();
    };

    // Strict per-source attempt cap before Siteverify. This does not replace
    // an upstream WAF/edge rule for volumetric Worker-invocation protection.
    let attempt;
    try { attempt = firstRow(await callRpc("consume_request_submission_attempt", { p_source_hash: sourceHash })); }
    catch { return jsonResponse(503, { error: "request_service_unavailable" }, origin, allowedOrigin); }
    if (!attempt || typeof attempt.allowed !== "boolean") {
      return jsonResponse(503, { error: "request_service_unavailable" }, origin, allowedOrigin);
    }
    if (!attempt.allowed) {
      const retry = Math.max(1, Math.min(3600, Number(attempt.retry_after_seconds) || 60));
      return jsonResponse(429, { error: "request_rate_limited" }, origin, allowedOrigin, { "Retry-After": String(retry) });
    }

    let challenge;
    try {
      const response = await fetchImpl(TURNSTILE_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: validated.value.turnstile_token }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error("challenge_unavailable");
      challenge = await response.json();
    } catch { return jsonResponse(503, { error: "challenge_service_unavailable" }, origin, allowedOrigin); }
    if (challenge?.success !== true || challenge?.hostname !== env.TURNSTILE_EXPECTED_HOSTNAME || challenge?.action !== "song_request") {
      return jsonResponse(403, { error: "challenge_rejected" }, origin, allowedOrigin);
    }

    let submission;
    try {
      submission = firstRow(await callRpc("submit_song_request_once", {
        p_source_hash: sourceHash,
        p_requester_name: validated.value.requester_name,
        p_song_title: validated.value.song_title,
        p_artist_name: validated.value.artist_name,
        p_note: validated.value.note,
        p_tracking_token: validated.value.tracking_token,
      }));
    } catch { return jsonResponse(503, { error: "request_service_unavailable" }, origin, allowedOrigin); }
    if (!submission || typeof submission.accepted !== "boolean") {
      return jsonResponse(503, { error: "request_service_unavailable" }, origin, allowedOrigin);
    }
    if (!submission.accepted) {
      if (submission.reason === "idempotency_conflict") return jsonResponse(409, { error: "tracking_token_conflict" }, origin, allowedOrigin);
      const retry = Math.max(1, Math.min(86400, Number(submission.retry_after_seconds) || 60));
      const code = submission.reason === "global_limit" ? "daily_request_limit_reached" : "request_rate_limited";
      return jsonResponse(429, { error: code }, origin, allowedOrigin, { "Retry-After": String(retry) });
    }
    return jsonResponse(submission.duplicate ? 200 : 201, {
      ok: true, duplicate: submission.duplicate === true, tracking_token: validated.value.tracking_token,
    }, origin, allowedOrigin);
  };
}

const handleRequest = createRequestGatewayHandler();
export default { fetch: handleRequest };
