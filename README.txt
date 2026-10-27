THE GRIFFLIST — WEBSITE + PRIVATE REQUEST DASHBOARD

FILES
Upload every file in this folder to the ROOT of your existing GitHub repository (the-grifflist). Do not upload the ZIP itself and do not put the files in another folder. Commit the changes to main. Keep GitHub Pages set to main / (root).

SUPABASE SETUP (one-time)
1. Create a free project at https://supabase.com/ and save the database password somewhere safe.
2. In the Supabase project, open SQL Editor, create a new query, paste the contents of supabase-setup.sql, and run it.
3. In Authentication > Providers / Sign In settings, make sure Email is enabled. In Authentication > Users, create or confirm your own email/password login. The admin UID used in the SQL is 7c4c9232-2c28-47f3-a00a-a371ed23cef5; confirm it matches your account before running the SQL. Use a strong unique password.
4. Run the contents of supabase-setup.sql in SQL Editor. It permits public submissions but restricts reading/updating requests to that exact admin UID.
5. In Authentication settings, disable new user sign-ups after confirming your admin account exists.
6. Open Project Settings > API (or Connect). The Project URL and publishable key (or legacy anon key) belong in supabase-config.js. Never use the service_role/secret key in website files.
7. Upload all website files, including supabase-config.js, admin.html, admin.js, and supabase-setup.sql, to the repository root and commit.
8. Open the public website and submit a test request. Open admin.html (or tap the tiny dot at the far right of the footer), sign in with your admin email/password, and confirm the request appears.

SECURITY NOTES
- The tiny footer dot is only a discreet link, not security. The dashboard is protected by Supabase email/password authentication.
- The browser-visible Project URL and publishable/anon key are expected to be public. Never publish a service_role/secret key.
- The SQL enables public INSERT but restricts SELECT/UPDATE to the specific admin UID above. Keep sign-ups disabled after confirming your account.
- This is a free-tier setup subject to Supabase's current limits and policies.
- Requests now go to the database instead of opening an SMS app. The website must be online and Supabase configured for submissions to work.

OTHER
Both sound files are separate: title-screen-sound.mp3 is for the title screen; select.mp3 is for navigation.


THE GRIFFLIST LIVE FEATURES UPGRADE (October 2026)

New features included:
- Rock Meter using the supplied Guitar Hero III Rock Meter artwork.
- Ko-fi support link and the QR image supplied for your Ko-fi account.
- PayPal.Me support link and existing e-transfer copy option.
- Encore voting section using the image from your supplied Reddit gallery link.
- Admin controls for the Rock Meter goal/confirmed total and publishing a three-song encore poll.
- Encore votes are submitted through Supabase RPC functions; one vote per browser token per poll (not a guarantee against someone using multiple browsers/devices).
- Stripe dashboard shortcut is inside the login-protected admin view; no Stripe secret key is stored in the site.

IMPORTANT SETUP BEFORE THESE FEATURES GO LIVE:
1. Back up your current repository files.
2. In your existing Supabase project, open SQL Editor and run supabase-live-features.sql ONCE. This is an additive migration; it does not replace or delete your song_requests table.
3. Upload all extracted website files to the ROOT of your GitHub Pages repository, replacing the matching files, and commit to main. Keep all files together at the root.
4. Sign in at your admin.html page. Set the Rock Meter goal and confirmed support total. Use the Encore Voting form to enter three options and check “Voting is open” before publishing.
5. Test on your phone: submit a normal song request, open Ko-fi and PayPal links, scan the QR code, cast one test vote, and confirm the Rock Meter displays the amount you entered.

PAYMENT NOTE:
The Ko-fi and PayPal buttons are support links. The website does not automatically verify payments and does not currently mark song requests as paid priority. Do not promise priority performance based on the link alone. Any paid-priority workflow needs manual payment matching and venue approval.

IMAGE NOTE:
The Rock Meter, Ko-fi QR, and Reddit gallery image are referenced from the URLs you supplied rather than bundled locally. If a host blocks hotlinking or changes its URL, that image may stop displaying. The supplied Reddit post appears to be about ticket service charges; the image is included in the Encore section because you asked to use it there.
