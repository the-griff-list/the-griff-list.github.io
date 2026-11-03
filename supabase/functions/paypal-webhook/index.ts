function required(name) {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Missing server configuration: " + name);
  return value;
}

async function paypalAccessToken(base, clientId, clientSecret) {
  const response = await fetch(base + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(clientId + ":" + clientSecret),
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
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("PayPal API request failed with HTTP " + response.status);
  return payload;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const supabaseUrl = required("SUPABASE_URL").replace(/\/$/, "");
    const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
    const clientId = required("PAYPAL_CLIENT_ID");
    const clientSecret = required("PAYPAL_CLIENT_SECRET");
    const webhookId = required("PAYPAL_WEBHOOK_ID");
    const base = (Deno.env.get("PAYPAL_API_BASE") || "https://api-m.paypal.com").replace(/\/$/, "");

    const rawBody = await request.text();
    let event;
    try { event = JSON.parse(rawBody); } catch { return new Response("Invalid JSON", { status: 400 }); }

    const accessToken = await paypalAccessToken(base, clientId, clientSecret);
    const verificationPayload = {
      auth_algo: request.headers.get("paypal-auth-algo"),
      cert_url: request.headers.get("paypal-cert-url"),
      transmission_id: request.headers.get("paypal-transmission-id"),
      transmission_sig: request.headers.get("paypal-transmission-sig"),
      transmission_time: request.headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: event
    };
    if (Object.values(verificationPayload).some((value) => !value)) {
      return new Response("Missing PayPal signature headers", { status: 400 });
    }

    const verification = await paypalRequest(base, accessToken, "/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: JSON.stringify(verificationPayload)
    });
    if (verification.verification_status !== "SUCCESS") {
      console.warn("Rejected PayPal webhook: signature verification failed");
      return new Response("Invalid signature", { status: 401 });
    }

    if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
      return new Response("Event acknowledged", { status: 200 });
    }

    const capture = event.resource || {};
    const captureId = String(capture.id || "");
    const orderId = String(capture.supplementary_data?.related_ids?.order_id || "");
    if (!captureId || !orderId || capture.status !== "COMPLETED") {
      return new Response("Capture details incomplete", { status: 202 });
    }

    const order = await paypalRequest(base, accessToken, "/v2/checkout/orders/" + encodeURIComponent(orderId));
    if (order.status !== "COMPLETED") return new Response("Order not completed", { status: 202 });

    const purchaseUnit = (order.purchase_units || [])[0];
    const customId = String(purchaseUnit?.custom_id || "");
    const orderAmount = purchaseUnit?.payments?.captures?.find((item) => item.id === captureId);
    const currency = String(orderAmount?.amount?.currency_code || capture.amount?.currency_code || "");
    const amount = Number(orderAmount?.amount?.value || capture.amount?.value || 0);

    if (!/^GRF-[A-F0-9]{8}$/i.test(customId) || currency.toUpperCase() !== "CAD" || amount < 5 || !orderAmount || orderAmount.status !== "COMPLETED") {
      console.warn("PayPal capture did not meet priority payment rules", { event_id: event.id, currency, amount });
      return new Response("Capture does not qualify for priority payment", { status: 200 });
    }

    const headers = {
      "apikey": serviceKey,
      "Authorization": "Bearer " + serviceKey,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    };
    const update = await fetch(
      supabaseUrl + "/rest/v1/song_requests?payment_reference=eq." + encodeURIComponent(customId.toUpperCase()) +
      "&payment_method=eq.paypal&payment_status=eq.pending&payment_checkout_reference=eq." + encodeURIComponent(orderId),
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          payment_status: "paid",
          payment_provider: "paypal",
          payment_provider_reference: captureId,
          payment_verified_at: new Date().toISOString()
        })
      }
    );
    if (!update.ok) throw new Error("Could not update the matching priority request");

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("PayPal webhook error:", error?.message || "unknown");
    return new Response("Temporary processing error", { status: 500 });
  }
});
