---
"@storywright/cli": minor
---

feat(storage): make baseline storage branch configurable via `storage.branch`

The S3 storage branch prefix was previously hardcoded to `"current"`, causing a
mismatch with CI workflows that download baselines from `"main"`. This led to
diff-only updates overwriting shard archives without existing baselines, resulting
in baseline loss and false "new" detections.

Added `storage.branch` config option (default: `"main"`) that controls the S3
prefix used for baseline upload and download. All hardcoded branch references in
engine, API, and CLI upload command now use this config value.
