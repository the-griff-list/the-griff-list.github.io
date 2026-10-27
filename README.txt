# The Grifflist website update

This package includes the updated mobile-friendly site files: `index.html`, `styles.css`, and `script.js`. Upload all three to the root of your `the-griff-list` GitHub repository, replacing the existing files.

## Included changes
- Top navigation: Send Tip, Make a Request, Song Catalog, Contact
- Request section near the top
- “Support” renamed to “Send Tip”
- Compact mobile song rows with title, artist, and release year; no row numbering or difficulty display
- Artist A–Z sorting, with names beginning in symbols/numbers after alphabetic artists
- Artist and genre filters, including Classic Country and Classic Rock
- Chronological decade buttons: 50s, 60s, 70s, 80s, 90s, 2000s, 2010s
- Custom splash artwork featuring Griffen, The Grifflist, and Live Repertoire, with black framing and a press-to-enter prompt
- Includes the optimized `splash-screen.webp` image file; upload it alongside the HTML, CSS, and JavaScript
- Existing songs and recent additions retained; duplicate titles are not intentionally added

## Before going live
1. In `script.js`, replace `YOUR-ETRANSFER-EMAIL@example.com` with the email you use for e-Transfer.
2. In `script.js`, replace the booking placeholder with your intended booking email or website.
3. For song requests, create a free form at Formspree and replace `REPLACE_WITH_YOUR_FORM_ID` in the `action` URL in `index.html` with your form ID. Until you do, the site clearly tells visitors that requests are not connected yet.
4. Social links currently point to generic Instagram/Facebook homepages; replace them with your artist profiles when ready.

The supplied guitarist artwork is now built into the splash screen. Make sure `splash-screen.webp` is uploaded to the repository root alongside the other three website files.


LATEST UPDATES
- Navigation order is Make a Request, Song Catalog, Send a Tip, Contact.
- Removed the hero promo section and genre selector.
- Catalog columns are Artist, Song (with a Spotify search/play icon), and Year.
- Tip e-transfer email is set to acdckicksass@hotmail.com.
- Booking button opens an email draft to griffenarsenaultmusic@hotmail.com.
- Instagram points to the supplied profile; Facebook link removed.

SPOTIFY PREVIEW NOTE
Spotify does not provide a dependable 15-second preview for every track through a simple public website integration. The play icon currently opens Spotify search for that exact artist and song; it does not stream a guaranteed 15-second sample directly on this page. Direct preview playback would require track IDs and preview URLs that Spotify makes available, and many tracks have no preview URL.


SPLASH SELECT SOUND
- The supplied select.mp3 plays when a visitor taps/clicks the splash screen or presses Enter/Space to enter the site.
- Upload select.mp3 to the same repository root as index.html, script.js, styles.css, and splash-screen.webp.
- Sound playback depends on the visitor's browser/device allowing audio after their tap or keypress; if audio is blocked, the site still opens normally.
