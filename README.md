# The Grifflist — Griffen Arsenault

A mobile-first, Guitar Hero III-inspired repertoire site with decade filters, artist browsing, search, optional short audio previews, song requests, tip email, and booking contact.

## Quick start
1. Download and extract this ZIP.
2. Open `index.html` in a browser to preview the site.
3. Edit `script.js` to replace the five example songs and set your contact details.
4. Publish the files with GitHub Pages using the steps below.

## Add your repertoire
In `script.js`, replace the sample entries inside `const songs = [...]`. Each entry can look like this:

```js
{
  title: "Song Title",
  artist: "Artist Name",
  decade: "80s",
  genre: "Classic Rock",
  difficulty: 3,
  key: "G",
  capo: "Capo 2",
  tuning: "Standard",
  notes: "Performance notes go here.",
  audio: "audio/song-title-preview.mp3"
}
```

Use decade values such as `60s`, `70s`, `80s`, `90s`, `2000s`, `2010s`, `2020s`, or `Other`. The decade buttons and artist dropdown are generated automatically from your song data. Difficulty is 1–5. `audio` is optional; leave it as an empty string until you add an audio file.

## Add short audio previews
- Create an `audio` folder in the repository and put short MP3 preview clips inside it.
- In each song's `audio` field, enter a relative path, e.g. `audio/track-name-preview.mp3`.
- `previewSeconds` in the `config` section of `script.js` controls the maximum playback time (currently 15 seconds).
- The site stops the previous preview when another preview is started.
- Use audio you have permission to publish. A purchased/downloaded commercial MP3 does not automatically give permission to publish it publicly. Large audio libraries can also use a lot of repository bandwidth; keep clips short and optimized.

## Connect song requests (required setup)
GitHub Pages serves static websites and does not itself receive/store form submissions. This starter uses Formspree as an easy form backend.

1. Visit https://formspree.io/ and create a free account/form (check its current free plan limits).
2. Create a form that emails submissions to your chosen inbox.
3. Copy the endpoint Formspree provides, in the form `https://formspree.io/f/xxxxxxxx`.
4. In `index.html`, find:
   `action="https://formspree.io/f/REPLACE_WITH_YOUR_FORM_ID"`
5. Replace the placeholder with your real endpoint and commit the file.
6. Test the published form. The name is required; the song title and artist are optional individually, but at least one of them is required. If both are blank, the page will show a validation message.

Do not put passwords, banking details, or private information in this repository. The public website's source is visible to visitors.

## Set your e-transfer tip email and booking contact
At the top of the `config` object in `script.js`, replace:
- `tipEmail: "YOUR-ETRANSFER-EMAIL@example.com"` with the email address you use for Interac e-Transfer. This address will be public on the website.
- `bookingUrl: "mailto:YOUR-BOOKING-EMAIL@example.com"` with your booking email or a full HTTPS URL to your booking/contact page.

Visitors can copy the tip email to their clipboard. The site does not collect or process payments.

## Publish with GitHub Pages for free
1. Sign in/create an account at https://github.com/.
2. Create a **public** repository named exactly `YOUR-GITHUB-USERNAME.github.io`.
3. Upload `index.html`, `styles.css`, `script.js`, and `README.md` to the repository root. Add the `audio` folder only if you are using previews.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, select **Deploy from a branch**.
6. Choose branch `main` and folder `/(root)`, then save.
7. After the deployment completes, visit `https://YOUR-GITHUB-USERNAME.github.io/`.
8. Future changes are published after you commit updated files.

Official guide: https://docs.github.com/en/pages/quickstart

## Naming
Suggested display name: **The Grifflist**. The example GitHub Pages address depends on the username you choose and is not reserved by this starter.
