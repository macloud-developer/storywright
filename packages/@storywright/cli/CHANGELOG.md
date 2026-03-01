# @storywright/cli

## 0.5.1

### Patch Changes

- [`d97f89d`](https://github.com/macloud-developer/storywright/commit/d97f89d4d6136527a766e6b664fcfa839955cd21) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Add parallel options to `update` command and update README documentation

  - `storywright update` に `--workers`, `--shard`, `--browsers`, `--filter`, `--retries` オプションを追加
  - README に `test` コマンドの `--workers` オプションを追記
  - README の `update` コマンドセクションにオプション説明を追加

## 0.5.0

### Minor Changes

- [`98e1df2`](https://github.com/macloud-developer/storywright/commit/98e1df2ac72be0d5b0f39939c351b4f991f6e203) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Add lazy loading and image preload to report, fix CLI version injection

  - DiffCard に IntersectionObserver を導入し、ビューポート付近に入るまで画像を読み込まないようにした
  - ImageTabs で全タブの画像を非表示 img で同時にプリロードし、タブ切り替えを瞬時にした
  - CLI のバージョンを package.json からビルド時に自動注入するようにした

### Patch Changes

- Updated dependencies [[`98e1df2`](https://github.com/macloud-developer/storywright/commit/98e1df2ac72be0d5b0f39939c351b4f991f6e203)]:
  - @storywright/report@0.5.0

## 0.4.1

### Patch Changes

- [`b7f9450`](https://github.com/macloud-developer/storywright/commit/b7f9450cb8bbff1357e02de679a19bde1165d322) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix report crash when retries produce duplicate failure entries

  - Reporter now keeps only the final retry result per test (Map instead of array)
  - DiffCardList uses unique keys to prevent Svelte duplicate key errors

- [`8431e84`](https://github.com/macloud-developer/storywright/commit/8431e849fe340c249ee320f91a3ee0aa6661f87c) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Remove `!vrt` tag filtering (incompatible with Storybook 8) and document `exclude` patterns

- Updated dependencies [[`b7f9450`](https://github.com/macloud-developer/storywright/commit/b7f9450cb8bbff1357e02de679a19bde1165d322)]:
  - @storywright/report@0.4.1

## 0.4.0

### Minor Changes

- [`fabb6cf`](https://github.com/macloud-developer/storywright/commit/fabb6cffb249c17f55bc8b174de0e5bd75a4c23c) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Add `retries` configuration option for flaky test retry

  - New `retries` field in `storywright.config.ts` (default: `0`)
  - New `--retries` CLI option to override config

## 0.3.9

### Patch Changes

- [`063546a`](https://github.com/macloud-developer/storywright/commit/063546a62a522303586582df04929dfc71cf507b) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix Storybook loading screen being captured in screenshots

  - Wait for actual story content to render inside `#storybook-root` (not just DOM presence)
  - Also detect portal-rendered content (modals, overlays) placed directly on `document.body`

## 0.3.8

### Patch Changes

- [`0cad3fd`](https://github.com/macloud-developer/storywright/commit/0cad3fd02b46a5ba62edab03ad7e591a8b06fea1) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Optimize test execution with file splitting, parallel baseline download, and CI diff-only

  - Split stories into chunks of 50 per test file for better Playwright worker/shard distribution
  - Download baselines in parallel with Storybook build to reduce total pipeline time
  - Enable `--diff-only` by default in CI environments (`process.env.CI`)

## 0.3.7

### Patch Changes

- [`e59c5f2`](https://github.com/macloud-developer/storywright/commit/e59c5f2f7619b9cab9d2a517f64e50ed4a32955d) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Improve test execution speed with faster page load strategy and higher parallelism

  - Switch `waitUntil` from `networkidle` (500ms idle wait) to `domcontentloaded`
    since fonts, images, and render stability are already checked explicitly
  - Increase default workers from 50% to 100% of CPU cores since VRT is I/O bound

## 0.3.6

### Patch Changes

- [`480bd73`](https://github.com/macloud-developer/storywright/commit/480bd73c7b26a3e6eac9e30dd0cf5b9605f69657) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Wait for all images to load before taking screenshots

  Add `img.complete` check for all `<img>` elements to prevent capturing
  placeholder or broken image states from lazy-loaded or dynamically sourced images.

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
