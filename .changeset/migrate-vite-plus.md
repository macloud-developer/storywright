---
"@storywright/cli": minor
"@storywright/report": minor
"@storywright/storage-s3": minor
---

Migrate toolchain to Vite+ (vite-plus), replacing Vite 6 + Vitest 3 + Biome with a unified toolchain. Upgrade to Vite 8, Vitest 4.1, and @sveltejs/vite-plugin-svelte v7. Rewrite imports from vite/vitest to vite-plus. Replace Biome with oxlint/oxfmt via vp check.
