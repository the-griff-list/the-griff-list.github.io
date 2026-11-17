/* Public browser configuration for The Grifflist.
   Publishable keys are designed to be visible in client-side code.
   NEVER put a Supabase secret/service_role key here. */
window.GRIFflist_SUPABASE_CONFIG = {
  url: "https://wgoepotvblksgjogougo.supabase.co",
  anonKey: "sb_publishable_QFRCFR3MMW9Qt75-VtnWnw_beH_NBIN",
  // Keep empty until the separate Cloudflare request Worker and Turnstile widget are deployed and verified.
  requestGatewayUrl: "",
  turnstileSiteKey: ""
};
if (window.supabase && window.GRIFflist_SUPABASE_CONFIG.url.startsWith("https://") && window.GRIFflist_SUPABASE_CONFIG.anonKey && !window.GRIFflist_SUPABASE_CONFIG.anonKey.startsWith("YOUR_")) {
  window.supabaseClient = window.supabase.createClient(window.GRIFflist_SUPABASE_CONFIG.url, window.GRIFflist_SUPABASE_CONFIG.anonKey);
}
