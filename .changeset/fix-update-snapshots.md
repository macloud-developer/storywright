---
"@storywright/cli": patch
---

fix(cli): set `updateSnapshots` explicitly to prevent false diff classification

Playwright defaults to `updateSnapshots: 'missing'`, which auto-creates snapshot files for new stories. These persist in `snapshotDir` across runs, causing subsequent runs to classify new stories as "diff" instead of "new". Now explicitly sets `updateSnapshots: 'none'` during test mode and `'all'` during update mode.
