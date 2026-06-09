---
"@storywright/cli": patch
---

fix(report): show the actual screenshot for new stories

New stories (no baseline) were reported with an empty `actual`, so the report
showed nothing for them. When a baseline is missing under `updateSnapshots:
'none'`, Playwright skips screenshot capture, so the generated test attaches a
fallback screenshot itself. That fallback used `testInfo.attach({ body })`,
which Playwright keeps in memory without a `path` — and the reporter only
copies attachments that expose a `path`, so the image was dropped.

The fallback now writes the screenshot to `testInfo.outputPath()` and attaches
it via `{ path }`, matching how Playwright's native diff attachments behave, so
new-story actual images reach the report.
