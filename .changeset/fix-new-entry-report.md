---
"@storywright/cli": patch
"@storywright/notifier-github": patch
---

fix: show actual screenshot for new stories; fix Failed count in GitHub notification

- New stories (no baseline) now show the actual screenshot in the HTML report.
  Playwright skips screenshot capture when the baseline is missing, so the test
  now explicitly captures and attaches one on failure.
- GitHub PR comment no longer double-counts new stories as Failed.
  The ❌ Failed row now uses the diff-entry count (type === 'diff') instead of
  summary.failed, which included baseline-missing failures.
