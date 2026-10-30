# QA Report — v32

Automated source checks are run during packaging. Real browser/device execution is not claimed.

Changes reviewed: toolbar links, centered anchor scroll calculation, What's New dialog structure and release window, taxi visibility audio handling, secret menu heading layout and ambience level, wallet badge theme CSS, footer logo shimmer.

Known platform limitation: browsers may suspend background audio and may require a prior user gesture before resuming playback. The code preserves the playback position and attempts resume when the page becomes visible.
