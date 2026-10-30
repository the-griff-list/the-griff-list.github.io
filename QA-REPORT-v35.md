# QA Report — v35

## Automated checks completed
- 7 HTML pages parsed; duplicate element IDs: none.
- 15 JavaScript files passed `node --check`.
- 17 raster images decoded successfully.
- `styles.css` parsed with tinycss2; 0 top-level CSS parse errors.
- Local HTML `src`/`href` references checked; no missing referenced local files.
- 54 service-worker asset references checked; no missing assets.
- JSON and webmanifest files parsed successfully.
- ZIP integrity test passed.

## Seasonal calendar review
- Added US Memorial Day, Juneteenth, Independence Day, US Labor Day, Veterans Day, and US Thanksgiving.
- Same-date US/Canadian observances are deduplicated in favour of the Canadian home-market wording.
- Campaign start/end dates are clipped to prevent adjacent holiday campaigns from competing.
- Christmas, Boxing Day, and the New Year campaign retain their dedicated December 18–January 1 sequence.
- Respectful observances (Remembrance Day, Truth and Reconciliation Day, Memorial Day, Veterans Day) do not use celebratory particle effects.

## Not verified
- Real browser interaction and visual rendering.
- Physical Android/iPhone behavior.
- Live GitHub Pages behavior and service-worker activation.

This report records automated source/package checks only. It does not claim physical-device or live-browser testing passed.
