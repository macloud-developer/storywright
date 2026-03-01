# @storywright/report

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
