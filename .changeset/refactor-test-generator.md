---
"@storywright/cli": patch
---

Extract page stabilization logic into `@storywright/cli/playwright/stabilize` module

- Add `initPage()` and `stabilizePage()` as public API for reproducible screenshot setup
- Simplify test-generator template from ~120 lines to ~55 lines
- No behavioral changes to the stabilization logic
