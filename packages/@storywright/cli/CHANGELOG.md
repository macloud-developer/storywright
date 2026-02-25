# @storywright/cli

## 0.3.5

### Patch Changes

- [`e6ad199`](https://github.com/macloud-developer/storywright/commit/e6ad19961390a86fd66b24faeeb5c49cd2a2ee83) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix waitForSelector timeout for portal, hidden dialog, and overlay components

  Use `state: 'attached'` instead of default `visible` for `#storybook-root`
  check. This fixes timeout errors for stories using portals, unopened dialogs,
  conditional rendering, and fixed-position overlays.

## 0.3.4

### Patch Changes

- [`7c41c70`](https://github.com/macloud-developer/storywright/commit/7c41c70151d86346ecaeaa3ebe093c8dcec3acbb) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix screenshot timing for portal/modal components

  Relax `#storybook-root > *` to `#storybook-root` so components rendered
  outside the root via portals are not missed. Add requestAnimationFrame
  wait for async render stabilization.

## 0.3.3

### Patch Changes

- [`23171a5`](https://github.com/macloud-developer/storywright/commit/23171a50b9d4646d89ef2258f15ece9e118983f6) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Show Playwright test progress in real-time during test and update commands

  Switched test execution from buffered to inherited stdio so Playwright's
  list reporter output (test names, pass/fail, timing) is visible as tests run.

## 0.3.2

### Patch Changes

- [`9e679bd`](https://github.com/macloud-developer/storywright/commit/9e679bdc38eb32e0ea1b6c837905574b5fcc44ff) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Wait for story render and font loading before taking screenshots

  Add `#storybook-root > *` selector wait and `document.fonts.ready` check
  after `networkidle` to prevent capturing loading states.

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
