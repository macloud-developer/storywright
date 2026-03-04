---
"@storywright/cli": patch
"@storywright/report": patch
---

Show all test results (including Pass) in the HTML report

- Rename `FailureEntry` to `TestEntry` with new `'pass'` type
- Rename `failures` to `entries` across CLI and report packages
- Add Pass filter button in report sidebar
- Pass entries show green checkCircle icon and PASS badge, no image tabs
