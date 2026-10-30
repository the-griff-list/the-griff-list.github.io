# Browser testing — v32

QA files are intentionally at the repository root (no `qa/` directory).

- Install dependencies: `npm install`
- Set the live HTTPS target: `GRIFFLIST_BASE_URL=https://the-griff-list.github.io`
- Run: `npm run test:browser`
- The suite includes desktop Chromium, Android-sized Chromium touch emulation, and iPhone WebKit emulation.

Device emulation is not a substitute for physical Android/iPhone testing. Background audio resume remains subject to browser and operating-system policies.
