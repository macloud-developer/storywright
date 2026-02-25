---
"@storywright/cli": patch
---

Fix waitForSelector timeout for portal, hidden dialog, and overlay components

Use `state: 'attached'` instead of default `visible` for `#storybook-root`
check. This fixes timeout errors for stories using portals, unopened dialogs,
conditional rendering, and fixed-position overlays.
