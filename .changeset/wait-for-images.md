---
"@storywright/cli": patch
---

Wait for all images to load before taking screenshots

Add `img.complete` check for all `<img>` elements to prevent capturing
placeholder or broken image states from lazy-loaded or dynamically sourced images.
