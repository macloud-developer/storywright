---
"@storywright/cli": patch
---

Fix WebKit screenshot capturing images before decode completes

- Add `img.decode()` after image load wait to ensure bitmaps are fully decoded before screenshot
- Fixes issue where expected screenshots on WebKit (Mobile Safari) captured placeholder/blank images, especially on ARM environments
