---
"@storywright/report": patch
---

Move `svelte` and `@tanstack/virtual-core` to devDependencies. The report is shipped as a prebuilt IIFE bundle with both libraries inlined, so they are no longer installed alongside `@storywright/cli`.
