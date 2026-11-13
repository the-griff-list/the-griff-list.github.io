import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  PAYPAL_LIVE_BASE,
  PAYPAL_SANDBOX_BASE,
  SUPABASE_PROJECT_ORIGIN,
  resolvePayPalApiBase,
  resolveSupabaseUrl,
  isExactPriorityAmount
} from "../supabase/functions/_shared/paypal-api-base.mjs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

assert.equal(resolvePayPalApiBase(undefined, undefined), PAYPAL_SANDBOX_BASE);
assert.equal(resolvePayPalApiBase("", undefined), PAYPAL_SANDBOX_BASE);
assert.equal(resolvePayPalApiBase(PAYPAL_SANDBOX_BASE, undefined), PAYPAL_SANDBOX_BASE);
assert.equal(resolvePayPalApiBase(PAYPAL_LIVE_BASE, "true"), PAYPAL_LIVE_BASE);
for (const value of [
  PAYPAL_LIVE_BASE,
  "http://api-m.sandbox.paypal.com",
  "https://api-m.sandbox.paypal.com.evil.example",
  "https://evil@api-m.sandbox.paypal.com",
  "https://api-m.sandbox.paypal.com:444",
  "https://api-m.sandbox.paypal.com/path",
  "https://api-m.sandbox.paypal.com/?x=1",
  "https://api-m.sandbox.paypal.com/#fragment",
  "https://api-m.sandbox.paypal.com.evil.example@evil.example"
]) assert.throws(() => resolvePayPalApiBase(value, undefined));
assert.throws(() => resolvePayPalApiBase(PAYPAL_LIVE_BASE, "TRUE"));
assert.throws(() => resolvePayPalApiBase(PAYPAL_LIVE_BASE, "1"));
assert.equal(resolveSupabaseUrl(SUPABASE_PROJECT_ORIGIN), SUPABASE_PROJECT_ORIGIN);
assert.equal(resolveSupabaseUrl(SUPABASE_PROJECT_ORIGIN + "/"), SUPABASE_PROJECT_ORIGIN);
for (const value of [
  "http://wgoepotvblksgjogougo.supabase.co",
  "https://wgoepotvblksgjogougo.supabase.co.evil.example",
  "https://evil@wgoepotvblksgjogougo.supabase.co",
  "https://wgoepotvblksgjogougo.supabase.co:444",
  "https://wgoepotvblksgjogougo.supabase.co/path",
  "https://attacker.supabase.co"
]) assert.throws(() => resolveSupabaseUrl(value));
console.log("PASS PayPal/Supabase endpoint allowlists and explicit Live opt-in");

for (const value of ["5", "5.0", "5.00"]) {
  assert.equal(isExactPriorityAmount(value), true, value);
}
for (const value of [
  "4.99", "5.01", "05.00", "5.000", "5e0", "NaN", "Infinity",
  " 5.00", "5.00 ", "", 5, null, undefined
]) {
  assert.equal(isExactPriorityAmount(value), false, String(value));
}
console.log("PASS exact CAD $5.00 PayPal priority amount policy");

const files = {
  index: read("index.html"),
  styles: read("styles.css"),
  admin: read("admin.html"),
  legal: read("legal.html"),
  qualityWorkflow: read(".github/workflows/quality.yml"),
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
  paymentSqlTests: read("priority-payment-matching-tests.sql"),
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
assert.match(files.index, /id="next-show"/);
assert.match(files.index, /NEXT DATE TO BE ANNOUNCED/);
assert.match(files.index, /No upcoming performance date is currently confirmed/);
assert.match(files.index, /BROWSE SONGS ↗/);
assert.ok(!files.index.includes("Friday, November 6, 2026"), "expired November 6 event must not be advertised");
assert.ok(!files.index.includes("11:00 p.m."), "expired event time must not remain on the homepage");
assert.ok(!files.index.includes("rihg.ca/events/category/hunters/2026-11"), "expired event listing link must be removed");
assert.match(files.legal, /not operated by, sponsored by, endorsed by, or officially affiliated with Hunter’s Ale House/);
assert.match(files.styles, /prefers-reduced-motion:reduce/);
assert.match(files.publicJs, /request-success-flash/);
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
assert.match(files.adminJs, /let stageSaved=true/);
assert.match(files.siteInteractions, /panel\.append\(ledger\)/);
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
assert.match(files.paypalWebhook, /record_verified_paypal_capture/);
assert.match(files.paymentSql, /record_verified_paypal_capture/);
assert.match(files.paymentSql, /coalesce\\(p_amount,0\\) <> 5\\.00/);
assert.match(files.paymentSqlTests, /TEST-LOW-CAPTURE-/);
assert.match(files.paymentSqlTests, /TEST-HIGH-CAPTURE-/);
assert.match(files.paypalWebhook, /isExactPriorityAmount\\(amount\\)/);
assert.match(files.paypalWebhook, /isExactPriorityAmount\\(capture\\.amount\\?\\.value\\)/);
assert.match(files.paymentSql, /create table if not exists public\.paypal_payments/);
assert.match(files.paymentSql, /verified_paypal_payment_updates_rockometer/);
assert.match(files.qualityWorkflow, /permissions:\s+contents:\s+read/);
assert.match(files.qualityWorkflow, /persist-credentials:\s+false/);
assert.match(files.paypalCreate, /amount: \{ currency_code: "CAD", value: "5\.00" \}/);
assert.match(files.paypalCreate, /resolvePayPalApiBase\(Deno\.env\.get\("PAYPAL_API_BASE"\), Deno\.env\.get\("PAYPAL_ENABLE_LIVE"\)\)/);
assert.match(files.paypalWebhook, /resolvePayPalApiBase\(Deno\.env\.get\("PAYPAL_API_BASE"\), Deno\.env\.get\("PAYPAL_ENABLE_LIVE"\)\)/);
assert.match(files.paypalCreate, /resolveSupabaseUrl\(required\("SUPABASE_URL"\)\)/);
assert.match(files.paypalWebhook, /resolveSupabaseUrl\(required\("SUPABASE_URL"\)\)/);
assert.ok((files.paypalCreate.match(/redirect: "error"/g) || []).length >= 4);
assert.ok((files.paypalWebhook.match(/redirect: "error"/g) || []).length >= 3);
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
