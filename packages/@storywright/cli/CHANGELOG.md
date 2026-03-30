# @storywright/cli

## 1.4.0

### Patch Changes

- Updated dependencies [[`1b66943`](https://github.com/macloud-developer/storywright/commit/1b669430c9d21020c9afec15ced30c2782c5a99a)]:
  - @storywright/report@1.4.0

## 1.3.1

### Patch Changes

- [`f427233`](https://github.com/macloud-developer/storywright/commit/f427233e1c562fae1f32c1d09593570c1124f6c2) Thanks [@kubotak-is](https://github.com/kubotak-is)! - fix(deps): bump simple-git minimum version to ^3.32.3 for CVE fix (GHSA-9p95-fxvg-qgq2)

## 1.3.0

### Minor Changes

- [`2d3aab9`](https://github.com/macloud-developer/storywright/commit/2d3aab9bdd07f02d2031e737f559219421bf320d) Thanks [@kubotak-is](https://github.com/kubotak-is)! - feat(storage): make baseline storage branch configurable via `storage.branch`

  The S3 storage branch prefix was previously hardcoded to `"current"`, causing a
  mismatch with CI workflows that download baselines from `"main"`. This led to
  diff-only updates overwriting shard archives without existing baselines, resulting
  in baseline loss and false "new" detections.

  Added `storage.branch` config option (default: `"main"`) that controls the S3
  prefix used for baseline upload and download. All hardcoded branch references in
  engine, API, and CLI upload command now use this config value.

### Patch Changes

- [`4b8fc17`](https://github.com/macloud-developer/storywright/commit/4b8fc179f9e0b017e89a40ca6d789a55d5a3df29) Thanks [@kubotak-is](https://github.com/kubotak-is)! - fix(reporter): use expected attachment instead of diff to determine new vs diff status

  Previously, the reporter checked for the presence of a "diff" image attachment to
  distinguish between "new" and "diff" test entries. This caused tests with existing
  baselines to be incorrectly classified as "new" when the diff image was not generated
  (e.g., test failure before screenshot comparison). Now checks for "expected" attachment
  instead, which reliably indicates that a baseline exists.

## 1.2.1

### Patch Changes

- Updated dependencies [[`b362d44`](https://github.com/macloud-developer/storywright/commit/b362d44b8f155ea5f73813b9117c1757c00d3357)]:
  - @storywright/report@1.2.1

## 1.2.0

### Minor Changes

- [#36](https://github.com/macloud-developer/storywright/pull/36) [`5314888`](https://github.com/macloud-developer/storywright/commit/5314888c5308314e39f0a6bf250c74ada46ca1e0) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Migrate toolchain to Vite+ (vite-plus), replacing Vite 6 + Vitest 3 + Biome with a unified toolchain. Upgrade to Vite 8, Vitest 4.1, and @sveltejs/vite-plugin-svelte v7. Rewrite imports from vite/vitest to vite-plus. Replace Biome with oxlint/oxfmt via vp check.

### Patch Changes

- Updated dependencies [[`5314888`](https://github.com/macloud-developer/storywright/commit/5314888c5308314e39f0a6bf250c74ada46ca1e0)]:
  - @storywright/report@1.2.0

## 1.1.1

### Patch Changes

- Updated dependencies [[`13795f1`](https://github.com/macloud-developer/storywright/commit/13795f1cfd95b538adc954353bba6e88fe7a2ca5)]:
  - @storywright/report@1.1.1

## 1.1.0

### Minor Changes

- [`0bf8177`](https://github.com/macloud-developer/storywright/commit/0bf8177c81e3c71e859bd5f84694f0a52359bb5d) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Add `baseBranchDiffDepth` config option and `--base-branch-diff-depth` CLI flag for proper diff detection on the base branch. Fix corrupted favicon base64 data in HTML report.

## 1.0.0

### Major Changes

- [`1d6828a`](https://github.com/macloud-developer/storywright/commit/1d6828a6d6044eee4ebf2354199a2ec45e3a2757) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Add SVG logo branding and embed favicon in HTML report

### Patch Changes

- Updated dependencies [[`1d6828a`](https://github.com/macloud-developer/storywright/commit/1d6828a6d6044eee4ebf2354199a2ec45e3a2757)]:
  - @storywright/report@1.0.0

## 0.5.9

### Patch Changes

- [`46475bb`](https://github.com/macloud-developer/storywright/commit/46475bba85e209f901d65f1cacdf9e208d878cd7) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Show all test results (including Pass) in the HTML report
  - Rename `FailureEntry` to `TestEntry` with new `'pass'` type
  - Rename `failures` to `entries` across CLI and report packages
  - Add Pass filter button in report sidebar
  - Pass entries show green checkCircle icon and PASS badge, no image tabs

- Updated dependencies [[`46475bb`](https://github.com/macloud-developer/storywright/commit/46475bba85e209f901d65f1cacdf9e208d878cd7)]:
  - @storywright/report@0.5.9

## 0.5.8

### Patch Changes

- [`0ff461e`](https://github.com/macloud-developer/storywright/commit/0ff461e545488714eec484dc12b59e4ee3a968c7) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Extract page stabilization logic into `@storywright/cli/playwright/stabilize` module
  - Add `initPage()` and `stabilizePage()` as public API for reproducible screenshot setup
  - Simplify test-generator template from ~120 lines to ~55 lines
  - No behavioral changes to the stabilization logic

## 0.5.7

### Patch Changes

- [`27ea5e3`](https://github.com/macloud-developer/storywright/commit/27ea5e35e96bc9f3edd78dc1ac0b28a41316cd84) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix WebKit screenshot capturing blank images on ARM environments
  - Reorder stabilization: run rAF settle before image load checks so the framework has finished adding all `<img>` elements to the DOM
  - Remove `img.decode()` which caused ~2x slowdown on WebKit ARM without fixing the blank image issue
  - Fixes issue where expected screenshots on WebKit (Mobile Safari) captured placeholder/blank images during update

## 0.5.6

### Patch Changes

- [`27ea5e3`](https://github.com/macloud-developer/storywright/commit/27ea5e35e96bc9f3edd78dc1ac0b28a41316cd84) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix WebKit screenshot capturing images before decode completes
  - Add `img.decode()` after image load wait to ensure bitmaps are fully decoded before screenshot
  - Fixes issue where expected screenshots on WebKit (Mobile Safari) captured placeholder/blank images, especially on ARM environments

## 0.5.5

### Patch Changes

- [`333db4d`](https://github.com/macloud-developer/storywright/commit/333db4d8615c52cc61bcd86af4e825c322d47e21) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix CI timeout during update and add S3 transfer progress logging
  - Skip unnecessary baseline download during `storywright update` (fixes CircleCI no-output timeout)
  - Add `onProgress` callback to `DownloadOptions` / `UploadOptions` for S3 transfer progress
  - S3 adapter now logs progress for archive download/extract, individual file transfers, and archive compression/upload

## 0.5.4

### Patch Changes

- [`2160b8c`](https://github.com/macloud-developer/storywright/commit/2160b8c941150ef9b737b6765e6db5e7f89e1263) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix report merge to copy shard assets directories
  - `storywright report --merge` now copies `assets/` directories from each shard report into the merged report directory
  - Fixes broken image links (expected/actual/diff) in merged HTML reports

- [`f46dcf3`](https://github.com/macloud-developer/storywright/commit/f46dcf33451a4699aa8d7443082f00269d5b82fa) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Implement tar.zst/tar.gz archive compression for S3 storage adapter
  - Upload: bundle files into a single tar archive, compress with zstd or gzip, multipart upload via `@aws-sdk/lib-storage`
  - Download: auto-detect compression from file extension, decompress and extract; falls back to individual file download for backward compatibility
  - Add `--shard` option to `upload` command for shard-aware archive naming
  - Clean up stale archives when shard count or compression format changes

## 0.5.3

### Patch Changes

- [`56f6957`](https://github.com/macloud-developer/storywright/commit/56f69576e31ad53d7f746c0fd30c511139f9a031) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Propagate exit code from `updateBaselines()` so CI correctly fails on test errors

## 0.5.2

### Patch Changes

- [`0306903`](https://github.com/macloud-developer/storywright/commit/0306903d8c9c1a9c7c3d69c36b06370d06362829) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix S3 storage adapter ESM compatibility by replacing `createRequire()` with dynamic `import()`

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
