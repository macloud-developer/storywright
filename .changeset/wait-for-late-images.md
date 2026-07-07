---
"@storywright/cli": minor
---

fix(cli): wait for late-added and undecoded images before screenshots

The image wait in `stabilizePage` ran only once, so images added to the DOM
after the check (async fetches, Suspense, delayed renders) were missed and
screenshots could be captured before they loaded.

Stabilization now waits for network activity to settle (3s cap) to cover
images not yet in the DOM and resources `document.images` cannot see (CSS
backgrounds, video posters, SVG `<image>`), polls `document.images` until
every image is complete (flipping lazy images to eager on each poll), and
awaits `img.decode()` so loaded-but-undecoded images do not capture as blank
areas. Timeouts now log a warning instead of silently proceeding.
