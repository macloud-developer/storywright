# @storywright/cli

## 0.3.1

### Patch Changes

- [`8bbe738`](https://github.com/macloud-developer/storywright/commit/8bbe7384d906a1f1c81f9120c917ede271ed88cc) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Remove locale and timezone from snapshot filenames to simplify paths

  Snapshot filenames now use `{arg}-{projectName}{ext}` instead of including
  locale and timezone, which caused issues with timezone slashes (e.g. Asia/Tokyo)
  creating unexpected directories.

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
