THE GRIFFLIST — CATALOG & REQUEST UPDATE

This package contains the website files directly in the ZIP root. When extracting, upload these files directly into the ROOT of your GitHub repository (the-griff-list/the-grifflist), replacing the existing versions. Do not upload the ZIP itself, and do not put the files inside an extra nested folder.

FILES TO UPLOAD:
- index.html
- styles.css
- script.js
- splash-screen.webp
- select.mp3
- title-screen-sound.mp3

WHAT THIS VERSION INCLUDES:
- Clean SMS request body: name, quoted song title, artist, and optional comments only. No field labels.
- Song catalog play icons open YouTube search results for the song and artist (including official audio search wording), rather than Spotify.
- Selecting a song fills the song and artist fields and scrolls to the request form.
- Original select.mp3 is used for website navigation/actions.
- ui-sound-06r.mp3 is included as title-screen-sound.mp3 and used for the title-screen entry interaction.
- Existing splash artwork, catalog, and styling are retained.

IMPORTANT LIMITATIONS:
- The SMS button opens the visitor's messaging app with a prefilled message; the visitor must press Send. A static GitHub Pages website cannot silently send SMS messages by itself.
- YouTube buttons open search results, not guaranteed inline playback. Search results and embedding availability vary by track.
- Song request queue/order and clearing it after a performance are manual (based on received SMS timestamps).

PUBLISHING:
1. Extract this ZIP.
2. Open https://github.com/the-griff-list/the-grifflist
3. Upload the six website files listed above into the repository root, replacing the old versions.
4. Commit the changes to the main branch.
5. After GitHub Pages finishes deploying, refresh https://the-griff-list.github.io/the-grifflist/ .

Both audio files must be uploaded with their exact filenames because index.html references them by these names.
