---
"@storywright/cli": patch
---

Remove locale and timezone from snapshot filenames to simplify paths

Snapshot filenames now use `{arg}-{projectName}{ext}` instead of including
locale and timezone, which caused issues with timezone slashes (e.g. Asia/Tokyo)
creating unexpected directories.
