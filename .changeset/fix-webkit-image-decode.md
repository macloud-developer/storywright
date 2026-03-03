---
"@storywright/cli": patch
---

Fix WebKit screenshot capturing blank images on ARM environments

- Reorder stabilization: run rAF settle before image load checks so the framework has finished adding all `<img>` elements to the DOM
- Remove `img.decode()` which caused ~2x slowdown on WebKit ARM without fixing the blank image issue
- Fixes issue where expected screenshots on WebKit (Mobile Safari) captured placeholder/blank images during update
