---
"@storywright/cli": patch
---

Fix Storybook loading screen being captured in screenshots

- Wait for actual story content to render inside `#storybook-root` (not just DOM presence)
- Also detect portal-rendered content (modals, overlays) placed directly on `document.body`
