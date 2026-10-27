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
