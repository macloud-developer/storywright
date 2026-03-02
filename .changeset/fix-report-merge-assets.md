---
"@storywright/cli": patch
---

Fix report merge to copy shard assets directories

- `storywright report --merge` now copies `assets/` directories from each shard report into the merged report directory
- Fixes broken image links (expected/actual/diff) in merged HTML reports
