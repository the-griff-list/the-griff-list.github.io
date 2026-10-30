# QA Report — v33

Automated source checks performed after packaging:
- HTML parser validation and duplicate-ID checks.
- JavaScript syntax validation with Node.
- CSS parser validation.
- Local asset reference checks.
- Service-worker precache reference checks.
- ZIP integrity check.

Not claimed: live browser rendering, actual Samsung/iPhone hardware tests, or real background-audio continuity. Those require a deployed HTTPS build and device/browser access.

Seasonal title logic is based on the device's local date and applies only from seven days before the holiday through the holiday itself. What's New auto-opens only when the release is within seven days and the release ID has not been marked seen in local storage.
