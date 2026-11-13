export const PAYPAL_SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
export const PAYPAL_LIVE_BASE = "https://api-m.paypal.com";
export const SUPABASE_PROJECT_ORIGIN = "https://wgoepotvblksgjogougo.supabase.co";

function requireCanonicalOrigin(raw, allowed, label) {
  if (typeof raw !== "string" || raw.length === 0 || raw !== raw.trim()) {
    throw new Error("Invalid " + label + " URL.");
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid " + label + " URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      url.pathname !== "/" || url.search || url.hash ||
      (raw !== url.origin && raw !== url.origin + "/") ||
      !allowed.includes(url.origin)) {
    throw new Error("Unapproved " + label + " URL.");
  }
  return url.origin;
}

export function resolvePayPalApiBase(rawBase, enableLive) {
  const configured = rawBase === undefined || rawBase === null || rawBase === ""
    ? PAYPAL_SANDBOX_BASE
    : rawBase;
  const base = requireCanonicalOrigin(configured, [PAYPAL_SANDBOX_BASE, PAYPAL_LIVE_BASE], "PayPal API base");
  if (base === PAYPAL_LIVE_BASE && enableLive !== "true") {
    throw new Error("PayPal Live requires explicit PAYPAL_ENABLE_LIVE=true.");
  }
  return base;
}

export function resolveSupabaseUrl(rawUrl) {
  return requireCanonicalOrigin(rawUrl, [SUPABASE_PROJECT_ORIGIN], "Supabase project");
}


/**
 * The PayPal priority checkout created by this integration is fixed at CAD 5.00.
 * PayPal returns amount.value as a decimal string. Accept only canonical decimal
 * forms for exactly five dollars; reject under/overpayments, exponent notation,
 * non-finite values, whitespace, numbers and excess precision.
 */
export function isExactPriorityAmount(value) {
  return typeof value === "string" && /^5(?:\.0{1,2})?$/.test(value);
}


export const PAYPAL_WEBHOOK_MAX_BODY_BYTES = 256 * 1024;
export const PAYPAL_CREATE_ORDER_MAX_BODY_BYTES = 8 * 1024;

/**
 * Read a request body with a strict byte ceiling before JSON parsing.
 * Content-Length is an early rejection hint; the streamed byte count remains
 * authoritative when the header is absent, incorrect, or uses chunked transfer.
 */
export async function readBoundedRequestText(request, maxBytes = PAYPAL_WEBHOOK_MAX_BODY_BYTES) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError("Request body limit must be a positive safe integer.");
  }
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) {
      try { await request.body?.cancel(); } catch {}
      throw new TypeError("Invalid request Content-Length.");
    }
    const declaredBytes = Number(declaredLength);
    if (!Number.isSafeInteger(declaredBytes) || declaredBytes > maxBytes) {
      try { await request.body?.cancel(); } catch {}
      throw new RangeError("Request payload exceeds the configured size limit.");
    }
  }

  if (!request.body) return "";
  const reader = request.body.getReader();
  const buffer = new Uint8Array(maxBytes);
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) {
        throw new TypeError("Request body stream must contain byte chunks.");
      }
      if (value.byteLength > maxBytes - totalBytes) {
        try { await reader.cancel(); } catch {}
        throw new RangeError("Request payload exceeds the configured size limit.");
      }
      buffer.set(value, totalBytes);
      totalBytes += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, totalBytes));
}
