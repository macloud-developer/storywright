---
"@storywright/cli": patch
---

Fix S3 storage adapter ESM compatibility by replacing `createRequire()` with dynamic `import()`
