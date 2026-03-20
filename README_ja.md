<p align="center">
  <img src="./storywright.svg" alt="Storywright" width="400" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@storywright/cli"><img src="https://img.shields.io/npm/v/@storywright/cli.svg" alt="npm version"></a>
  <a href="https://github.com/macloud-developer/storywright/actions/workflows/ci.yml"><img src="https://github.com/macloud-developer/storywright/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/macloud-developer/storywright/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@storywright/cli.svg" alt="license"></a>
</p>

> Storybook + Playwright ベースのセルフホスティング VRT ツール

[English README](./README.md)

Storywright は Storybook のストーリーを自動で撮影し、ベースライン画像と比較して UI の視覚的差分を検出します。

## 特徴

- `npx @storywright/cli test` ですぐ開始
- `git diff` ベースの差分実行 (`--diff-only`)
- マルチブラウザ実行（Chromium / Firefox / WebKit）
- HTML レポート生成（`summary.json` + `index.html`）
- ベースライン保存先を Local / S3 で切替可能
- CI 向けのシャード実行とレポートマージ対応

## 動作要件

- Node.js `>=20`
- Storybook `>=8`（推奨）
- Playwright `>=1.40`

## クイックスタート

```bash
npm install -D @storywright/cli @playwright/test
npx playwright install --with-deps chromium
npx storywright test
```

デフォルト出力:

- レポート: `.storywright/report/index.html`
- サマリー: `.storywright/report/summary.json`
- 一時ファイル: `.storywright/tmp`

## 設定

ひな形作成:

```bash
npx storywright init
```

設定例:

```ts
import { defineConfig } from "@storywright/cli";

export default defineConfig({
  storybook: {
    staticDir: "storybook-static",
    buildCommand: "npx storybook build --stats-json",
    compatibility: "auto", // auto | v8
  },

  browsers: ["chromium", "webkit"],

  browserOptions: {
    mobile: {
      browserName: "chromium",
      viewport: { width: 375, height: 812 },
      isMobile: true,
      exclude: ["**/DesktopOnly/**"],
    },
  },

  screenshot: {
    fullPage: true,
    animations: "disabled",
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    freezeTime: "2024-01-01T00:00:00",
    timezone: "UTC",
    locale: "en-US",
    seed: 1,
  },

  diffDetection: {
    enabled: true,
    baseBranch: "main",
    baseBranchDiffDepth: 1, // ベースブランチ上で比較するコミット数
    watchFiles: ["package.json", "package-lock.json", ".storybook/**/*"],
  },

  storage: {
    provider: "local", // local | s3
    local: {
      baselineDir: ".storywright/baselines",
    },
  },

  report: {
    outputDir: ".storywright/report",
    title: "Storywright Report",
  },

  workers: "auto", // number | 'auto'
  retries: 0, // フレーキーテスト対策のリトライ回数

  timeout: {
    test: 30000, // テストごとのタイムアウト (ms)
    navigation: 20000, // ページ遷移タイムアウト (ms)
    expect: 10000, // アサーションタイムアウト (ms)
  },

  include: ["**"],
  exclude: ["**/Experimental/**"],

  hooks: {
    beforeScreenshot: async (page, story) => {
      // 例: Cookie バナーを閉じる
    },
    afterScreenshot: async (page, story) => {
      // 例: クリーンアップ
    },
  },
});
```

## CLI

### `storywright test`

```bash
npx storywright test
npx storywright test --diff-only
npx storywright test --browsers chromium,webkit
npx storywright test --shard 1/4
npx storywright test --workers 4
npx storywright test --threshold 0.05
npx storywright test --max-diff-pixel-ratio 0.03
npx storywright test --filter "Components/**"
npx storywright test --reporters default,html
npx storywright test --output-dir .artifacts/storywright
npx storywright test --storybook-url http://localhost:6006
npx storywright test --full-page false
npx storywright test --retries 2
npx storywright test --base-branch-diff-depth 3
```

主なオプション:

- `--browsers`: ブラウザ指定（カンマ区切り）
- `--diff-only`: 変更影響のあるストーリーのみ実行
- `--full-page`: フルページスクリーンショット（`true` または `false`）
- `--shard`: `index/total` 形式
- `--workers`: 並列ワーカー数（`auto` または数値）
- `--threshold`: 1 ピクセル単位の閾値
- `--max-diff-pixel-ratio`: 画像全体の差分許容率
- `--filter`: ストーリー絞り込み glob
- `--output-dir`: 出力ルート（指定時は `<output-dir>/report`）
- `--reporters`: Playwright レポーター指定（`default`, `html`, `dot`, `json` など）
- `--storybook-url`: 起動済み Storybook URL
- `--storybook-dir`: Storybook 静的ファイルディレクトリ
- `--retries`: 失敗テストのリトライ回数
- `--update-snapshots`: ベースライン更新
- `--base-branch-diff-depth`: ベースブランチ上で比較するコミット数（デフォルト: `1`）

### `storywright update`

ベースラインスナップショットを更新します。`test` と同じ並列オプションに対応しています。

```bash
npx storywright update
npx storywright update --all
npx storywright update --upload
npx storywright update --shard 1/4
npx storywright update --workers 4
npx storywright update --browsers chromium,webkit
npx storywright update --filter "Components/**"
```

- `--all`: 全ベースラインを再生成（差分検出をスキップ）
- `--upload`: 更新後にリモートストレージへアップロード
- `--shard`: `index/total` 形式
- `--workers`: 並列ワーカー数（`auto` または数値）
- `--browsers`: ブラウザ指定（カンマ区切り）
- `--filter`: ストーリー絞り込み glob
- `--retries`: 失敗テストのリトライ回数
- `--base-branch-diff-depth`: ベースブランチ上で比較するコミット数（デフォルト: `1`）

### `storywright upload` / `storywright download`

```bash
npx storywright upload
npx storywright download --branch main
```

### `storywright report`

```bash
npx storywright report --open
npx storywright report --merge --from ".storywright/shards/*/summary.json"
```

`--merge` は統合 `summary.json` を作成し、`index.html` も再生成します。

### `storywright init`

```bash
npx storywright init
```

## ストーリーのフィルタリング

`storywright.config.ts` の `include` / `exclude` glob パターンで、テスト対象のストーリーを制御できます。パターンはフルストーリー名（`Component/StoryName`）に対してマッチします。

```ts
export default defineConfig({
  include: ["**"], // 全ストーリーを対象（デフォルト）
  exclude: ["**/Experimental/**"], // パターンに一致するストーリーを除外
});
```

## 終了コード

- `0`: 成功（差分なし）
- `1`: 成功（差分あり）
- `2`: 実行エラー
- `130`: 中断

## ベースラインストレージ

### ローカルストレージ（デフォルト）

デフォルトでは、ベースラインは `.storywright/baselines/` に保存され、git にコミットして管理します。外部ストレージは不要です。

```bash
# UI 変更後にベースラインを更新
npx storywright update

# コードと一緒にベースラインをコミット
git add .storywright/baselines/
git commit -m "update VRT baselines"
```

> `.storywright/baselines/` が `.gitignore` に含まれて**いない**ことを確認してください。`.storywright/tmp/` と `.storywright/report/` のみを ignore します。

### S3 アダプター

```bash
npm install -D @storywright/storage-s3
```

```ts
import { defineConfig } from "@storywright/cli";

export default defineConfig({
  storage: {
    provider: "s3",
    s3: {
      bucket: "my-vrt-bucket",
      prefix: "storywright/baselines",
      region: "ap-northeast-1",
      compression: "zstd",
    },
  },
});
```

## プログラマブル API

```ts
import { createStorywright } from "@storywright/cli";

const sw = await createStorywright({
  browsers: ["chromium"],
});

const result = await sw.test({ diffOnly: true });
// result: { exitCode, summary?, reportDir?, snapshotDir? }
console.log(result.exitCode, result.summary, result.reportDir);

// サマリーを人間が読める文字列にフォーマット
const report = sw.generateReport(result);
if (report) console.log(report);

await sw.update({ all: false });
await sw.upload();
await sw.download({ branch: "main" });
```

## CI ガイド

- [CI セットアップガイド](./docs/ci-setup.ja.md)

## ライセンス

MIT
