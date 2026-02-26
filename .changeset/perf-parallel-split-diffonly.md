---
"@storywright/cli": patch
---

Optimize test execution with file splitting, parallel baseline download, and CI diff-only

- Split stories into chunks of 50 per test file for better Playwright worker/shard distribution
- Download baselines in parallel with Storybook build to reduce total pipeline time
- Enable `--diff-only` by default in CI environments (`process.env.CI`)
