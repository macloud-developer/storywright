---
"@storywright/cli": patch
---

Wait for story render and font loading before taking screenshots

Add `#storybook-root > *` selector wait and `document.fonts.ready` check
after `networkidle` to prevent capturing loading states.
