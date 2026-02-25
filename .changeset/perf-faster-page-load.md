---
"@storywright/cli": patch
---

Improve test execution speed with faster page load strategy and higher parallelism

- Switch `waitUntil` from `networkidle` (500ms idle wait) to `domcontentloaded`
  since fonts, images, and render stability are already checked explicitly
- Increase default workers from 50% to 100% of CPU cores since VRT is I/O bound
