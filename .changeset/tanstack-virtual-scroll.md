---
"@storywright/report": minor
---

feat(report): replace custom virtual scroll with @tanstack/virtual-core

- Migrate from hand-rolled virtual scroll to @tanstack/virtual-core for reliable scroll positioning
- Enable dynamic height measurement so expanded diff cards are fully visible
- Fix sidebar scroll-to-index accuracy and active item tracking
- Remove IntersectionObserver lazy loading (redundant with virtual scroll)
- Add dev-only Vite plugin to serve placeholder images for /assets/\* requests
