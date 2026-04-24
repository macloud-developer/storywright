# @storywright/report

## 1.6.2

### Patch Changes

- [`b1ec4b9`](https://github.com/macloud-developer/storywright/commit/b1ec4b9bb15b2688efb0ad28c5f9425539793500) Thanks [@kubotak-is](https://github.com/kubotak-is)! - fix: remove diff ratio percentage display (was always 0.0%)

  The Playwright reporter hardcoded `diffRatio: 0` for every entry, so every diff was shown as `0.0%` across the HTML report (card badge, sidebar meta line), CLI reporter, and GitHub PR comment table. Remove the percentage display and the Diff column in the PR comment until we actually compute the ratio.

## 1.6.1

### Patch Changes

- [`3e1124a`](https://github.com/macloud-developer/storywright/commit/3e1124a7a348429a80b88d0aabd9420dbea1a119) Thanks [@kubotak-is](https://github.com/kubotak-is)! - fix(report): prevent crash and stale content when filter drastically reduces entry count

  When switching filters (e.g. Pass → Diff) on reports where the entry counts differ significantly, the virtual scroll's cached items would reference indices beyond the new entries array. This caused `TypeError: Cannot read properties of undefined (reading 'type')` during render and left the old list visible. Template now guards with `{#if entry}`, and the sidebar resets its scroll position on entries change (matching the main card list).

## 1.5.0

### Minor Changes

- Add Slide tab for side-by-side image comparison with draggable divider, preserve image tab selection across virtual scroll, and add seed report generator for development.

## 1.4.1

### Patch Changes

- [`f89eb0b`](https://github.com/macloud-developer/storywright/commit/f89eb0bb811fc3cd67b94b48f6bd541858e6160f) Thanks [@kubotak-is](https://github.com/kubotak-is)! - docs: add package READMEs for npm publish pages

## 1.4.0

### Minor Changes

- [`1b66943`](https://github.com/macloud-developer/storywright/commit/1b669430c9d21020c9afec15ced30c2782c5a99a) Thanks [@kubotak-is](https://github.com/kubotak-is)! - feat(report): replace custom virtual scroll with @tanstack/virtual-core
  - Migrate from hand-rolled virtual scroll to @tanstack/virtual-core for reliable scroll positioning
  - Enable dynamic height measurement so expanded diff cards are fully visible
  - Fix sidebar scroll-to-index accuracy and active item tracking
  - Remove IntersectionObserver lazy loading (redundant with virtual scroll)
  - Add dev-only Vite plugin to serve placeholder images for /assets/\* requests

## 1.2.1

### Patch Changes

- [`b362d44`](https://github.com/macloud-developer/storywright/commit/b362d44b8f155ea5f73813b9117c1757c00d3357) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix virtual scroll overscan direction and add sidebar virtualization
  - Fix overscan to apply more buffer in the scroll direction, preventing blank areas when scrolling down
  - Add virtual scroll to Sidebar for large entry lists, reducing DOM nodes from N to ~50
  - Adjust card list padding for consistent spacing

## 1.2.0

### Minor Changes

- [#36](https://github.com/macloud-developer/storywright/pull/36) [`5314888`](https://github.com/macloud-developer/storywright/commit/5314888c5308314e39f0a6bf250c74ada46ca1e0) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Migrate toolchain to Vite+ (vite-plus), replacing Vite 6 + Vitest 3 + Biome with a unified toolchain. Upgrade to Vite 8, Vitest 4.1, and @sveltejs/vite-plugin-svelte v7. Rewrite imports from vite/vitest to vite-plus. Replace Biome with oxlint/oxfmt via vp check.

## 1.1.1

### Patch Changes

- [`13795f1`](https://github.com/macloud-developer/storywright/commit/13795f1cfd95b538adc954353bba6e88fe7a2ca5) Thanks [@kubotak-is](https://github.com/kubotak-is)! - 仮想スクロールの導入により大量の差分エントリ描画時の DOM 負荷を軽減。GitHub 風のフィルタードロップダウン（Type/Browser）を追加し、サイドバーにツールチップ表示・アイコンカラーを適用。スクロール方向に応じた非対称 overscan で上方向スクロール時の表示切れを防止。ImageTabs の二重スクロール問題を修正。

## 1.0.0

### Major Changes

- [`1d6828a`](https://github.com/macloud-developer/storywright/commit/1d6828a6d6044eee4ebf2354199a2ec45e3a2757) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Add SVG logo branding and embed favicon in HTML report

## 0.5.9

### Patch Changes

- [`46475bb`](https://github.com/macloud-developer/storywright/commit/46475bba85e209f901d65f1cacdf9e208d878cd7) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Show all test results (including Pass) in the HTML report
  - Rename `FailureEntry` to `TestEntry` with new `'pass'` type
  - Rename `failures` to `entries` across CLI and report packages
  - Add Pass filter button in report sidebar
  - Pass entries show green checkCircle icon and PASS badge, no image tabs

## 0.5.0

### Minor Changes

- [`98e1df2`](https://github.com/macloud-developer/storywright/commit/98e1df2ac72be0d5b0f39939c351b4f991f6e203) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Add lazy loading and image preload to report, fix CLI version injection
  - DiffCard に IntersectionObserver を導入し、ビューポート付近に入るまで画像を読み込まないようにした
  - ImageTabs で全タブの画像を非表示 img で同時にプリロードし、タブ切り替えを瞬時にした
  - CLI のバージョンを package.json からビルド時に自動注入するようにした

## 0.4.1

### Patch Changes

- [`b7f9450`](https://github.com/macloud-developer/storywright/commit/b7f9450cb8bbff1357e02de679a19bde1165d322) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix report crash when retries produce duplicate failure entries
  - Reporter now keeps only the final retry result per test (Map instead of array)
  - DiffCardList uses unique keys to prevent Svelte duplicate key errors
