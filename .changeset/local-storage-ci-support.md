---
"@storywright/cli": minor
---

feat(storage): add git-based baseline extraction for local storage CI support

- Flatten `LocalStorageAdapter` to store baselines directly in `baselineDir/` (no branch subdirectories)
- Add `downloadFromGit()` method using `git ls-tree` + `git show` for cross-platform binary-safe extraction
- Fix `updateBaselines()` to correctly save snapshots back to `baselineDir` from `snapshotDir`
- Add self-copy guard in `upload()` to prevent `ERR_FS_CP_EINVAL`
- Update `init` command to use granular `.gitignore` patterns (`.storywright/tmp/`, `.storywright/report/`)
- Update `download` command and Programmatic API to use git extraction for local storage
