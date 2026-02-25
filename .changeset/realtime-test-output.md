---
"@storywright/cli": patch
---

Show Playwright test progress in real-time during test and update commands

Switched test execution from buffered to inherited stdio so Playwright's
list reporter output (test names, pass/fail, timing) is visible as tests run.
