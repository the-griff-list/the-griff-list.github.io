/* The Supabase project URL and publishable/anon key go here after project setup.
   These are public client-side values. NEVER put a service_role/secret key in this file. */
window.GRIFflist_SUPABASE_CONFIG = {
  url: "YOUR_SUPABASE_PROJECT_URL",
  anonKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
};
if (window.supabase && window.GRIFflist_SUPABASE_CONFIG.url.startsWith("https://") && !window.GRIFflist_SUPABASE_CONFIG.anonKey.startsWith("YOUR_")) {
  window.supabaseClient = window.supabase.createClient(window.GRIFflist_SUPABASE_CONFIG.url, window.GRIFflist_SUPABASE_CONFIG.anonKey);
}
