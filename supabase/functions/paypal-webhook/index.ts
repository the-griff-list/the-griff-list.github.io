function required(name) {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Missing server configuration: " + name);
  return value;
}

async function paypalAccessToken(base, clientId, clientSecret) {
  const response = await fetch(base + "/v1/oauth2/token", {
    method: "POST",
    redirect: "error",
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
    redirect: "error",
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

async function supabaseRequest(url, serviceKey, path, options = {}) {
  const response = await fetch(url + path, {
    ...options,
    redirect: "error",
    headers: {
      "apikey": serviceKey,
      "Authorization": "Bearer " + serviceKey,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error("Payment database request failed with HTTP " + response.status);
  if (response.status === 204) return null;
  return response.json().catch(() => null);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { isExactPriorityAmount, readBoundedRequestText, resolvePayPalApiBase, resolveSupabaseUrl } = await import("../_shared/paypal-api-base.mjs");
    const supabaseUrl = resolveSupabaseUrl(required("SUPABASE_URL"));
    const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
    const clientId = required("PAYPAL_CLIENT_ID");
    const clientSecret = required("PAYPAL_CLIENT_SECRET");
    const webhookId = required("PAYPAL_WEBHOOK_ID");
    const base = resolvePayPalApiBase(Deno.env.get("PAYPAL_API_BASE"), Deno.env.get("PAYPAL_ENABLE_LIVE"));

    let rawBody;
    try {
      rawBody = await readBoundedRequestText(request);
    } catch (error) {
      if (error instanceof RangeError) {
        return new Response("Webhook payload too large", { status: 413 });
      }
      return new Response("Invalid webhook body", { status: 400 });
    }
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

    const eventType = String(event.event_type || "");
    if (!["CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED"].includes(eventType)) {
      return new Response("Event acknowledged", { status: 200 });
    }

    const orderId = eventType === "CHECKOUT.ORDER.APPROVED"
      ? String(event.resource?.id || "")
      : String(event.resource?.supplementary_data?.related_ids?.order_id || "");
    if (!orderId) return new Response("Order reference missing", { status: 202 });

    const order = await paypalRequest(base, accessToken, "/v2/checkout/orders/" + encodeURIComponent(orderId));
    const purchaseUnits = Array.isArray(order.purchase_units) ? order.purchase_units : [];
    if (purchaseUnits.length !== 1) {
      return new Response("Order must contain exactly one purchase unit", { status: 200 });
    }
    const purchaseUnit = purchaseUnits[0];
    const customId = String(purchaseUnit?.custom_id || "");
    const orderAmount = purchaseUnit?.amount || {};
    const amount = orderAmount.value;
    const currency = String(orderAmount.currency_code || "");

    if (!/^GRF-[A-F0-9]{12}$/i.test(customId) || currency.toUpperCase() !== "CAD" || !isExactPriorityAmount(amount)) {
      console.warn("PayPal order did not meet priority payment rules", { event_id: event.id, currency, amount });
      return new Response("Order does not qualify for priority payment", { status: 200 });
    }

    const filter = "?payment_checkout_reference=eq." + encodeURIComponent(orderId) +
      "&payment_reference=eq." + encodeURIComponent(customId.toUpperCase()) +
      "&payment_method=eq.paypal&payment_status=eq.pending&select=tracking_token&limit=1";
    const matches = await supabaseRequest(supabaseUrl, serviceKey, "/rest/v1/song_requests" + filter);
    if (!matches?.length) return new Response("No pending request matches this PayPal order", { status: 200 });

    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      if (order.status === "COMPLETED") return new Response("Order already completed", { status: 200 });
      if (order.status !== "APPROVED") return new Response("Order is not approved", { status: 202 });

      // PayPal requires the merchant to capture an approved Orders API payment.
      await paypalRequest(base, accessToken, "/v2/checkout/orders/" + encodeURIComponent(orderId) + "/capture", {
        method: "POST",
        headers: { "PayPal-Request-Id": "capture-" + orderId },
        body: "{}"
      });
      return new Response("Approved order capture requested", { status: 200 });
    }

    if (order.status !== "COMPLETED") return new Response("Order not completed", { status: 202 });
    const captureId = String(event.resource?.id || "");
    const capture = purchaseUnit?.payments?.captures?.find((item) => item.id === captureId);
    if (!captureId || !capture || capture.status !== "COMPLETED" ||
        String(capture.amount?.currency_code || "").toUpperCase() !== "CAD" ||
        !isExactPriorityAmount(capture.amount?.value)) {
      return new Response("Completed capture details did not qualify", { status: 200 });
    }

    // Atomically match the verified capture, mark the request paid, and
    // record the Rock-O-Meter event once per unique capture ID.
    const recorded = await supabaseRequest(supabaseUrl, serviceKey, "/rest/v1/rpc/record_verified_paypal_capture", {
      method: "POST",
      body: JSON.stringify({
        p_capture_id: captureId,
        p_order_id: orderId,
        p_payment_reference: customId.toUpperCase(),
        p_amount: 5.00,
        p_currency: "CAD"
      })
    });
    if (recorded !== true) return new Response("No matching pending request for this capture", { status: 200 });

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("PayPal webhook error:", error?.message || "unknown");
    return new Response("Temporary processing error", { status: 500 });
  }
});
