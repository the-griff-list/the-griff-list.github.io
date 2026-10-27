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
- Mobile-friendly splash screen and black framing, with a press-to-enter prompt
- Existing songs and recent additions retained; duplicate titles are not intentionally added

## Before going live
1. In `script.js`, replace `YOUR-ETRANSFER-EMAIL@example.com` with the email you use for e-Transfer.
2. In `script.js`, replace the booking placeholder with your intended booking email or website.
3. For song requests, create a free form at Formspree and replace `REPLACE_WITH_YOUR_FORM_ID` in the `action` URL in `index.html` with your form ID. Until you do, the site clearly tells visitors that requests are not connected yet.
4. Social links currently point to generic Instagram/Facebook homepages; replace them with your artist profiles when ready.

The splash is a CSS-built placeholder interpretation, not the previously generated guitarist artwork. To use the exact artwork, add the image to the repository and replace the splash illustration block in `index.html` accordingly.
