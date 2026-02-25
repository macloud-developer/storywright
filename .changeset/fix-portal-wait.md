---
"@storywright/cli": patch
---

Fix screenshot timing for portal/modal components

Relax `#storybook-root > *` to `#storybook-root` so components rendered
outside the root via portals are not missed. Add requestAnimationFrame
wait for async render stabilization.
