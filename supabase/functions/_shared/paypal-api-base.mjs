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
  return typeof value === "string" && /^5(?:\\.0{1,2})?$/.test(value);
}
