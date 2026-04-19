# 通知設定ガイド

[English version](./notifications.md)

テスト実行後、VRT 結果を GitHub のプルリクエストなどに通知します。

## 前提条件

- Node.js >= 20
- `@storywright/cli` インストール済み
- GitHub PR コメント通知には `@storywright/notifier-github` が必要

```bash
pnpm add -D @storywright/notifier-github
```

## クイックスタート

`storywright test` 実行後に PR へ結果を投稿します:

```bash
npx storywright test
npx storywright notify github
```

CLI が CI 環境（GitHub Actions / CircleCI）を自動検出し、テストサマリをコメントとして投稿します。

## レポートURL テンプレート

`storywright.config.ts` に URL テンプレートを設定すると、通知にレポートへのリンクが自動で含まれます:

```ts
import { defineConfig } from "@storywright/cli";

export default defineConfig({
  report: {
    url: "https://cdn.example.com/${prNumber}/vrt/report/index.html",
  },
});
```

### テンプレート変数

| 変数           | 説明                             | 例                  |
| -------------- | -------------------------------- | ------------------- |
| `${prNumber}`  | PR 番号                          | `123`               |
| `${branch}`    | ブランチ名（URLエンコード済）    | `feat%2Fnew-button` |
| `${sha}`       | フルコミット SHA                 | `abc123def456...`   |
| `${shortSha}`  | 短縮コミット SHA（7文字）        | `abc123d`           |
| `${timestamp}` | ISO タイムスタンプ（コンパクト） | `20260419T120000`   |

変数は CI 環境変数または CLI 引数から解決されます。

### 優先順位

1. `--report-url` CLI 引数（リテラル URL、テンプレート展開なし）
2. config の `report.url`（テンプレート展開あり）
3. 省略（コメントにリンクなし）

## GitHub PR コメント

### 動作の仕組み

1. `summary.json` からマークダウンのサマリを構築
2. PR 上の既存 Storywright コメントを検索（隠しマーカーで識別）
3. 既存コメントを更新 or 新規作成（upsert）

### CLI での使い方

```bash
# CI 環境を自動検出
npx storywright notify github

# 明示的にオプション指定
npx storywright notify github \
  --token "$GITHUB_TOKEN" \
  --repo "owner/repo" \
  --pr 123 \
  --report-url "https://cdn.example.com/report"

# 投稿せずにプレビュー
npx storywright notify github --dry-run

# summary.json のパスを指定（マージ後など）
npx storywright notify github --from ".storywright/report/summary.json"
```

### CLI 引数

| 引数            | 説明                                       | デフォルト                         |
| --------------- | ------------------------------------------ | ---------------------------------- |
| `--token`       | GitHub トークン                            | 自動検出                           |
| `--repo`        | リポジトリ（`owner/repo`）                 | 自動検出                           |
| `--pr`          | PR 番号                                    | 自動検出                           |
| `--report-url`  | レポートURL（config テンプレートを上書き） | —                                  |
| `--from`        | `summary.json` のパス                      | `.storywright/report/summary.json` |
| `--dry-run`     | マークダウンを stdout に出力               | `false`                            |
| `--max-entries` | 差分一覧の最大表示件数                     | `10`                               |
| `--when`        | 条件: `always` / `on-diff` / `on-error`    | `always`                           |

### CI 環境の自動検出

| CI プロバイダ      | トークン                   | リポジトリ                         | PR 番号                 |
| ------------------ | -------------------------- | ---------------------------------- | ----------------------- |
| **GitHub Actions** | `GITHUB_TOKEN`（自動）     | `GITHUB_REPOSITORY`                | `GITHUB_REF`            |
| **CircleCI**       | `GITHUB_TOKEN`（手動設定） | `CIRCLE_PROJECT_USERNAME/REPONAME` | `CIRCLE_PULL_REQUEST`   |
| **汎用**           | `STORYWRIGHT_GITHUB_TOKEN` | `STORYWRIGHT_GITHUB_REPO`          | `STORYWRIGHT_PR_NUMBER` |

### 必要な権限

| CI プロバイダ      | 必要な権限              | 設定方法                                 |
| ------------------ | ----------------------- | ---------------------------------------- |
| **GitHub Actions** | `pull-requests: write`  | ワークフロー YAML の `permissions`       |
| **CircleCI**       | `repo` スコープ付き PAT | Project Settings > Environment Variables |
| **その他**         | `repo` スコープ付き PAT | `STORYWRIGHT_GITHUB_TOKEN` or `--token`  |

## CI 設定例

### GitHub Actions

```yaml
jobs:
  vrt:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps chromium
      - run: npx storywright test
      - run: npx storywright notify github
        if: always()
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: storywright-report
          path: .storywright/report/
```

### CircleCI

```yaml
jobs:
  vrt:
    docker:
      - image: mcr.microsoft.com/playwright:v1.59.1-noble
    steps:
      - checkout
      - run: pnpm install --frozen-lockfile
      - run: npx storywright test
      - run:
          name: PR に通知
          command: npx storywright notify github --report-url "https://cdn.example.com/${PR_ID}/report"
          when: always
      - store_artifacts:
          path: .storywright/report
          destination: storywright-report
```

## プログラマティック API

`storywright.config.ts` に notifiers を設定すると、`storywright test` 後に自動で通知されます:

```ts
import { defineConfig } from "@storywright/cli";
import { githubNotifier } from "@storywright/notifier-github";

export default defineConfig({
  report: {
    url: "https://cdn.example.com/${prNumber}/vrt/report/index.html",
  },
  notifiers: [
    githubNotifier({
      when: "always",
    }),
  ],
});
```

### オプション

| オプション       | 型        | デフォルト  | 説明                                    |
| ---------------- | --------- | ----------- | --------------------------------------- |
| `token`          | `string`  | 自動検出    | GitHub トークン                         |
| `repository`     | `string`  | 自動検出    | `owner/repo`                            |
| `prNumber`       | `number`  | 自動検出    | PR 番号                                 |
| `maxEntries`     | `number`  | `10`        | コメント内の差分表示件数                |
| `collapseOnPass` | `boolean` | `true`      | 全 pass 時に折りたたみ                  |
| `deleteOnPass`   | `boolean` | `false`     | 全 pass 時にコメント削除                |
| `reportUrl`      | `string`  | config から | レポートURL を上書き                    |
| `when`           | `string`  | `"always"`  | `"always"` / `"on-diff"` / `"on-error"` |

## トラブルシューティング

- **「GitHub environment not detected」**: トークン・リポジトリ・PR 番号が検出できませんでした。`--token`, `--repo`, `--pr` を明示的に指定してください。
- **「@storywright/notifier-github package not found」**: `pnpm add -D @storywright/notifier-github` でインストールしてください。
- **GitHub API から 403 エラー**: トークンに `pull-requests: write` 権限（GitHub Actions）または `repo` スコープ（PAT）があることを確認してください。
- **コメントが重複する**: Notifier は隠しマーカー（`<!-- storywright-report -->`）で既存コメントを検索・更新します。手動でマーカーを削除すると重複が発生します。
