import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const files = {
  index: read("index.html"),
  admin: read("admin.html"),
  legal: read("legal.html"),
  watch: read("watch-live.html"),
  explore: read("explore.html"),
  taxi: read("taxi-services.html"),
  publicJs: read("script.js"),
  adminJs: read("admin.js"),
  adminFeatures: read("admin-features.js"),
  siteInteractions: read("site-interactions.js"),
  paypalCreate: read("supabase/functions/paypal-create-order/index.ts"),
  paypalWebhook: read("supabase/functions/paypal-webhook/index.ts"),
  paymentSql: read("priority-payment-matching.sql"),
  mfaSql: read("admin-mfa-enforcement.sql"),
  donationWallSql: read("confirmed-donation-wall.sql")
};

for (const [name, source] of Object.entries({
  publicJs: files.publicJs,
  adminJs: files.adminJs,
  adminFeatures: files.adminFeatures,
  siteInteractions: files.siteInteractions,
  paypalCreate: files.paypalCreate,
  paypalWebhook: files.paypalWebhook
})) {
  new vm.Script(source, { filename: name });
  console.log("PASS JavaScript syntax:", name);
}

for (const [name, html] of [["index.html", files.index], ["admin.html", files.admin], ["legal.html", files.legal], ["watch-live.html", files.watch], ["explore.html", files.explore], ["taxi-services.html", files.taxi]]) {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, [], name + " contains duplicate IDs");
  console.log("PASS unique HTML IDs:", name);
}

assert.match(files.index, /<h2><span>Donations<\/span><\/h2>/);
assert.match(files.index, /payment-action">Donate/);
assert.match(files.index, /href="legal\.html"/);
assert.match(files.index, /nav-booking-cta/);
assert.doesNotMatch(files.index, /Send a Tip|Tip ↗|TIP THE HOSPITALITY CREW/i);
assert.doesNotMatch(files.index, /Griffen\.transfers@hotmail\.com|acdckicksass@hotmail\.com/);
for (const [name, html] of [["watch-live.html", files.watch], ["explore.html", files.explore], ["taxi-services.html", files.taxi]]) {
  assert.doesNotMatch(html, /Send a Tip|TIP ↗|Interac e-Transfer|Griffen\.transfers@hotmail\.com|acdckicksass@hotmail\.com/i, name + " contains retired payment wording");
}
console.log("PASS public donation wording and e-transfer security pause");

assert.match(files.admin, /stage-mode-toggle/);
assert.match(files.admin, /admin-request-search/);
assert.match(files.admin, /admin-request-filter/);
assert.match(files.admin, /admin-show-status/);
assert.match(files.admin, /mfa-gate-form/);
assert.match(files.admin, /admin-mfa-enroll-form/);
assert.match(files.adminJs, /applyRequestFilters/);
assert.match(files.adminJs, /auth\.mfa\.enroll/);
assert.match(files.adminJs, /auth\.mfa\.verify/);
assert.match(files.adminFeatures, /syncShowStatus/);
assert.match(files.adminFeatures, /startCancelled/);
assert.match(files.adminFeatures, /Show marked offline/);
console.log("PASS stage dashboard, request filters, live status and MFA controls");

assert.match(files.paymentSql, /GRF-\[A-F0-9\]\{12\}/);
assert.match(files.paymentSql, /match_kofi_tip_to_priority_request/);
assert.match(files.paymentSql, /payment_status = 'paid'/);
assert.match(files.paypalWebhook, /verify-webhook-signature/);
assert.match(files.paypalWebhook, /PAYMENT\.CAPTURE\.COMPLETED/);
assert.match(files.paypalWebhook, /payment_status=eq\.pending/);
assert.match(files.paypalCreate, /amount: \{ currency_code: "CAD", value: "5\.00" \}/);
assert.match(files.mfaSql, /as restrictive for all to authenticated/);
assert.match(files.mfaSql, /aal2/);
assert.match(files.donationWallSql, /confirmed = true/);
assert.match(files.donationWallSql, /Admin manages confirmed donations/);
console.log("PASS payment reference, verified payment and database MFA contracts");

assert.match(files.legal, /Privacy notice/);
assert.match(files.legal, /does not issue official charitable donation receipts/);
assert.match(files.legal, /SOCAN/);
console.log("PASS legal information page content");

for (const [name, source] of Object.entries({
  publicJs: files.publicJs,
  adminJs: files.adminJs,
  adminFeatures: files.adminFeatures,
  index: files.index,
  admin: files.admin
})) {
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|PAYPAL_CLIENT_SECRET|KOFI_VERIFICATION_TOKEN/);
}
console.log("PASS no server-side secret names in public/browser assets");
