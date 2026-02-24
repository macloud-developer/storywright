# @storywright/cli

## 0.3.0

### Minor Changes

- [`ff0e066`](https://github.com/macloud-developer/storywright/commit/ff0e066010d7687190ffa8b45ca41219880c6469) Thanks [@kubotak-is](https://github.com/kubotak-is)! - BREAKING: Drop Storybook 7 support and raise minimum Node.js to 20

  - Remove `compatibility: 'v7'` option (only `'auto' | 'v8'` supported)
  - Remove Storybook 7 `stories` key normalization from index.json parser
  - Raise minimum Node.js version from 18 to 20 across all packages
  - Storywright now requires Storybook 8 or later

## 0.2.0

### Minor Changes

- [`ee53ae3`](https://github.com/macloud-developer/storywright/commit/ee53ae3ab8e4771defa2cbac2b8e9510bcd66c48) Thanks [@kubotak-is](https://github.com/kubotak-is)! - feat(storage): add git-based baseline extraction for local storage CI support

  - Flatten `LocalStorageAdapter` to store baselines directly in `baselineDir/` (no branch subdirectories)
  - Add `downloadFromGit()` method using `git ls-tree` + `git show` for cross-platform binary-safe extraction
  - Fix `updateBaselines()` to correctly save snapshots back to `baselineDir` from `snapshotDir`
  - Add self-copy guard in `upload()` to prevent `ERR_FS_CP_EINVAL`
  - Update `init` command to use granular `.gitignore` patterns (`.storywright/tmp/`, `.storywright/report/`)
  - Update `download` command and Programmatic API to use git extraction for local storage
