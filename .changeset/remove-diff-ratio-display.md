---
"@storywright/cli": patch
"@storywright/report": patch
"@storywright/notifier-github": patch
---

fix: remove diff ratio percentage display (was always 0.0%)

The Playwright reporter hardcoded `diffRatio: 0` for every entry, so every diff was shown as `0.0%` across the HTML report (card badge, sidebar meta line), CLI reporter, and GitHub PR comment table. Remove the percentage display and the Diff column in the PR comment until we actually compute the ratio.
