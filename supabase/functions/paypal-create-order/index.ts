const corsHeaders = {
  "Access-Control-Allow-Origin": "https://the-griff-list.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function required(name) {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Missing server configuration: " + name);
  return value;
}

async function paypalAccessToken(base, clientId, clientSecret) {
  const credentials = btoa(clientId + ":" + clientSecret);
  const response = await fetch(base + "/v1/oauth2/token", {
    method: "POST",
    redirect: "error",
    headers: {
      "Authorization": "Basic " + credentials,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new Error("PayPal authentication failed");
  return payload.access_token;
}

async function paypalRequest(base, token, path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    redirect: "error",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("PayPal request failed with HTTP " + response.status);
  return payload;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { readBoundedRequestText, PAYPAL_CREATE_ORDER_MAX_BODY_BYTES, resolvePayPalApiBase, resolveSupabaseUrl } = await import("../_shared/paypal-api-base.mjs");
    const supabaseUrl = resolveSupabaseUrl(required("SUPABASE_URL"));
    const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
    const clientId = required("PAYPAL_CLIENT_ID");
    const clientSecret = required("PAYPAL_CLIENT_SECRET");
    const base = resolvePayPalApiBase(Deno.env.get("PAYPAL_API_BASE"), Deno.env.get("PAYPAL_ENABLE_LIVE"));

    let rawBody;
    try {
      rawBody = await readBoundedRequestText(request, PAYPAL_CREATE_ORDER_MAX_BODY_BYTES);
    } catch (error) {
      if (error instanceof RangeError) return json(413, { error: "Request body too large." });
      return json(400, { error: "Invalid request body." });
    }
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json(400, { error: "Invalid JSON request body." });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json(400, { error: "A JSON object is required." });
    }
    const trackingToken = String(body.tracking_token || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trackingToken)) {
      return json(400, { error: "A valid request tracking token is required." });
    }

    const headers = { "apikey": serviceKey, "Authorization": "Bearer " + serviceKey };
    const lookup = await fetch(
      supabaseUrl + "/rest/v1/song_requests?tracking_token=eq." + encodeURIComponent(trackingToken) +
      "&select=tracking_token,payment_reference,payment_method,payment_status,payment_checkout_reference&limit=1",
      { headers, redirect: "error" }
    );
    if (!lookup.ok) throw new Error("Could not load the priority request");
    const rows = await lookup.json();
    const row = rows[0];
    if (!row || row.payment_method !== "paypal" || !row.payment_reference) {
      return json(404, { error: "No PayPal priority payment is available for this request." });
    }
    if (row.payment_status === "paid") return json(409, { error: "This priority request is already paid." });
    if (row.payment_status !== "pending") return json(409, { error: "This request is not awaiting payment." });

    const accessToken = await paypalAccessToken(base, clientId, clientSecret);
    if (row.payment_checkout_reference) {
      const existing = await paypalRequest(base, accessToken, "/v2/checkout/orders/" + encodeURIComponent(row.payment_checkout_reference));
      const existingApproval = (existing.links || []).find((link) => ["approve", "payer-action"].includes(link.rel));
      if ((existing.status === "CREATED" || existing.status === "PAYER_ACTION_REQUIRED") && existingApproval?.href) {
        return json(200, { approve_url: existingApproval.href, order_id: existing.id, payment_reference: row.payment_reference });
      }
      return json(409, { error: "A PayPal checkout was already created for this request. Check its status before attempting another payment." });
    }

    const returnUrl = "https://the-griff-list.github.io/?paypal=return&ref=" + encodeURIComponent(row.payment_reference);
    const cancelUrl = "https://the-griff-list.github.io/?paypal=cancel&ref=" + encodeURIComponent(row.payment_reference);
    const idempotencyKey = trackingToken.replace(/-/g, "");
    const order = await paypalRequest(base, accessToken, "/v2/checkout/orders", {
      method: "POST",
      headers: { "PayPal-Request-Id": idempotencyKey },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: row.payment_reference,
          custom_id: row.payment_reference,
          description: "The Grifflist priority song request",
          amount: { currency_code: "CAD", value: "5.00" }
        }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "The Grifflist",
              user_action: "PAY_NOW",
              return_url: returnUrl,
              cancel_url: cancelUrl
            }
          }
        }
      })
    });

    const approval = (order.links || []).find((link) => ["approve", "payer-action"].includes(link.rel));
    if (!order.id || !approval?.href) throw new Error("PayPal did not return an approval link");

    const save = await fetch(
      supabaseUrl + "/rest/v1/song_requests?tracking_token=eq." + encodeURIComponent(trackingToken) +
      "&payment_status=eq.pending&payment_method=eq.paypal",
      {
        method: "PATCH",
        redirect: "error",
        headers: { ...headers, "Content-Type": "application/json", "Prefer": "return=minimal" },
        body: JSON.stringify({ payment_checkout_reference: order.id })
      }
    );
    if (!save.ok) throw new Error("Could not attach PayPal checkout to the request");

    return json(200, { approve_url: approval.href, order_id: order.id, payment_reference: row.payment_reference });
  } catch (error) {
    console.error("PayPal create-order error:", error?.message || "unknown");
    return json(500, { error: "PayPal checkout is temporarily unavailable. Please use another payment method." });
  }
});
