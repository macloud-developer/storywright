# CI セットアップガイド

[English version](./ci-setup.md)

このガイドでは、Storywright を CI/CD パイプラインで実行するための構成を説明します。

## 前提条件

- Node.js >= 20
- Storybook >= 8
- プロジェクトに `@playwright/test` がインストール済み
- Storybook ビルドで `index.json` を生成できること（通常 `storybook-static/`）
- `--diff-only` を使う場合は git 履歴が必要（`fetch-depth: 0`）

## ストレージ戦略

### ローカルストレージ（デフォルト、S3 不要）

デフォルトのローカルストレージ戦略では、ベースラインを git にコミットして管理します。外部ストレージ（S3）は不要です。

**ワークフロー:**

1. 開発者がローカルで UI を変更
2. `npx storywright update` を実行してベースラインスクリーンショットを再生成
3. コード変更と一緒に更新されたベースラインをコミット
4. CI が `npx storywright test` を実行 — ベースラインは git から取得
5. レビュアーは GitHub の PR 上でスクリーンショットの差分を直接確認

> **Tip:** UI を変更したのにベースラインの更新を忘れた場合、CI が不一致を検出してテストが失敗します。これは安全ネットとして機能します。

> **`.gitignore` の設定:** `.storywright/tmp/` と `.storywright/report/` のみを ignore してください。`.storywright/baselines/` は git で追跡する必要があります。`npx storywright init` を新規プロジェクトで実行すると自動的に設定されます。既存プロジェクトで `.storywright/` が `.gitignore` に含まれている場合は、手動で `.storywright/tmp/` と `.storywright/report/` に置き換えてください。

### S3 ストレージ

大規模プロジェクトやベースラインを git にコミットするのが現実的でない場合は、S3 アダプターを使用してください。[AWS ベースライン同期](#aws-ベースライン同期oidc-推奨)セクションを参照してください。

## 推奨フロー

```text
Storybook ビルド -> Storywright 実行 -> レポート保存 -> PR 通知（オプション）
```

> **PR 通知:** `npx storywright notify github` で VRT 結果を GitHub PR コメントとして投稿できます。詳しくは[通知設定ガイド](./notifications.ja.md)を参照してください。

> S3 ストレージの場合は、Storywright 実行の前に「ベースライン取得」ステップを追加してください。

保存すべき Artifact:

- `.storywright/report/index.html`
- `.storywright/report/summary.json`
- `.storywright/report/assets/**`

---

## GitHub Actions

### 基本ワークフロー（ローカルストレージ）

```yaml
# .github/workflows/vrt.yml
name: Visual Regression Test

on:
  pull_request:
    branches: [main]

concurrency:
  group: vrt-${{ github.head_ref }}
  cancel-in-progress: true

jobs:
  vrt:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: corepack enable
      - run: pnpm install --frozen-lockfile

      - name: Playwright ブラウザインストール
        run: npx playwright install --with-deps chromium

      - name: Storybook ビルド
        run: npx storybook build --stats-json

      - name: Storywright 実行
        run: npx storywright test

      - name: レポートをアップロード
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: storywright-report
          path: .storywright/report/
          retention-days: 14
```

### `--diff-only` で PR を高速化

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0

- name: Storywright (diff-only)
  run: npx storywright test --diff-only
```

### シャーディング + レポート統合

```yaml
name: Visual Regression Test

on:
  pull_request:
    branches: [main]

jobs:
  vrt:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps chromium
      - run: npx storybook build --stats-json

      - name: シャード実行
        run: npx storywright test --shard ${{ matrix.shard }}/4

      - name: シャードレポートをアップロード
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: storywright-shard-${{ matrix.shard }}
          path: .storywright/report/
          retention-days: 1

  merge-report:
    needs: vrt
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: corepack enable
      - run: pnpm install --frozen-lockfile

      - name: シャード成果物をダウンロード
        uses: actions/download-artifact@v4
        with:
          pattern: storywright-shard-*
          path: .storywright/shards

      - name: summary を統合して HTML を再生成
        run: npx storywright report --merge --from ".storywright/shards/*/summary.json"

      - name: 統合レポートをアップロード
        uses: actions/upload-artifact@v4
        with:
          name: storywright-report
          path: .storywright/report/
          retention-days: 14
```

### AWS ベースライン連携（OIDC 推奨）

長期キーではなく、GitHub OIDC + IAM Role を推奨します。

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: actions/checkout@v4

  - name: AWS 認証を設定（OIDC）
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/<ROLE_NAME>
      aws-region: ap-northeast-1

  - name: ベースライン取得
    run: npx storywright download --branch main

  - name: Storywright 実行
    run: npx storywright test

  - name: ベースライン更新（main のみ）
    if: github.ref == 'refs/heads/main'
    run: npx storywright update --upload
```

補足:

- IAM Role の trust policy で `token.actions.githubusercontent.com` を許可。
- リポジトリ/ブランチ条件は最小権限で絞り込む。

---

## CircleCI

### 基本ワークフロー

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  node: circleci/node@6.1

executors:
  playwright:
    docker:
      - image: mcr.microsoft.com/playwright:v1.50.0-noble

jobs:
  vrt:
    executor: playwright
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: pnpm
      - run: npx storybook build --stats-json
      - run: npx storywright test
      - store_artifacts:
          path: .storywright/report
          destination: storywright-report

workflows:
  test:
    jobs:
      - vrt
```

### CircleCI で `--diff-only`

```yaml
- checkout
- run: git fetch --prune --unshallow || true
- run: npx storywright test --diff-only
```

### シャーディング + レポート統合

```yaml
version: 2.1

orbs:
  node: circleci/node@6.1

executors:
  playwright:
    docker:
      - image: mcr.microsoft.com/playwright:v1.50.0-noble

jobs:
  vrt:
    executor: playwright
    parallelism: 4
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: pnpm
      - run: npx storybook build --stats-json
      - run:
          name: シャード実行
          command: |
            SHARD_INDEX=$((CIRCLE_NODE_INDEX + 1))
            SHARD_TOTAL=$CIRCLE_NODE_TOTAL
            npx storywright test --shard ${SHARD_INDEX}/${SHARD_TOTAL}
      - run:
          name: シャード summary を保存
          command: |
            mkdir -p .storywright/shards/${CIRCLE_NODE_INDEX}
            cp .storywright/report/summary.json .storywright/shards/${CIRCLE_NODE_INDEX}/summary.json
      - persist_to_workspace:
          root: .
          paths:
            - .storywright/shards

  merge-report:
    executor: playwright
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: pnpm
      - attach_workspace:
          at: .
      - run:
          name: summary を統合して HTML を再生成
          command: npx storywright report --merge --from ".storywright/shards/*/summary.json"
      - store_artifacts:
          path: .storywright/report
          destination: storywright-report

workflows:
  test:
    jobs:
      - vrt
      - merge-report:
          requires:
            - vrt
```

### CircleCI での AWS ベースライン連携

次のいずれかを利用します。

1. Context / Project 環境変数で `AWS_ACCESS_KEY_ID` などを注入
2. CircleCI OIDC + AWS STS AssumeRoleWithWebIdentity（OIDC 推奨）

その上で以下を実行:

```yaml
- run: npx storywright download --branch main
- run: npx storywright test
```

---

## main マージ時のベースライン更新

PR が `main` にマージされたタイミングでベースラインを更新すると、以降の PR は最新の承認済みスクリーンショットと比較されます。

`storywright update` はデフォルトで差分のみ（変更影響のあるストーリーだけ）を再キャプチャします。全件再取得するには `--all` を付けてください。

> **重要:** ベースブランチ（例: `main`）上で実行すると、`git merge-base main HEAD` は `HEAD` 自身を返すため、差分が空になりストーリーが検出されません。Storywright は `baseBranchDiffDepth`（デフォルト: `1`）を使って `HEAD~N..HEAD` で比較することでこれを自動的に処理します。マージコミットに複数の親がある場合は、config または CLI（`--base-branch-diff-depth`）でこの値を増やしてください。

### GitHub Actions

```yaml
# .github/workflows/vrt-update.yml
name: Update VRT Baselines

on:
  push:
    branches: [main]

concurrency:
  group: vrt-update-${{ github.ref }}
  cancel-in-progress: true

jobs:
  update-baselines:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: corepack enable
      - run: pnpm install --frozen-lockfile

      - name: Playwright ブラウザインストール
        run: npx playwright install --with-deps chromium

      - name: Storybook ビルド
        run: npx storybook build --stats-json

      - name: 現在のベースライン取得
        run: npx storywright download --branch main

      - name: ベースライン更新（差分のみ）
        run: npx storywright update --upload
```

> **補足:** `storywright update`（`--all` なし）は変更のあったストーリーのみ再キャプチャします。全件再取得するには `npx storywright update --all --upload` を使用してください。

> **Tip:** `--base-branch-diff-depth` でベースブランチ上の比較コミット数を調整できます（デフォルト: `1`）。squash マージなど、1コミットに多くの変更が含まれるマージ戦略の場合は値を増やしてください。

### CircleCI

```yaml
  update-baselines:
    executor: playwright
    steps:
      - checkout
      - run: git fetch --prune --unshallow || true
      - node/install-packages:
          pkg-manager: pnpm
      - run: npx storybook build --stats-json
      - run: npx storywright download --branch main
      - run: npx storywright update --upload

workflows:
  update:
    jobs:
      - update-baselines:
          filters:
            branches:
              only: main
```

---

## 終了コード

| コード | 意味                   | CI 判定              |
| ------ | ---------------------- | -------------------- |
| `0`    | 成功（差分なし）       | Pass                 |
| `1`    | 成功（差分あり）       | Fail（レポート確認） |
| `2`    | 実行エラー             | Fail（ログ確認）     |
| `130`  | 中断（SIGINT/SIGTERM） | Fail / canceled      |

## CI 向け設定例

```ts
import { defineConfig } from "@storywright/cli";

export default defineConfig({
  browsers: ["chromium"],
  screenshot: {
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
    animations: "disabled",
    freezeTime: "2024-01-01T00:00:00",
    timezone: "UTC",
    locale: "en-US",
    seed: 1,
  },
  diffDetection: {
    baseBranch: "main",
    baseBranchDiffDepth: 1, // ベースブランチ上で比較するコミット数
  },
  workers: "auto",
});
```

## トラブルシューティング

- `aws-cli/install` orb で "unzip: not found" エラーが発生する:
  - Playwright Docker イメージ（`mcr.microsoft.com/playwright:*-noble`）には `unzip` が含まれていません。orb ステップの前にインストールしてください:
    ```yaml
    - run: apt-get update && apt-get install -y unzip
    ```
  - または、カスタム Docker イメージで AWS CLI をプリインストールする方法もあります。
- `--diff-only` なのに全件実行される:
  - git 履歴取得と `storywright.config.ts` の `baseBranch` を確認。
- ベースブランチ（`main` など）上で差分が検出されない:
  - ベースブランチ上では `merge-base` が `HEAD` を返すため差分が空になります。Storywright は `baseBranchDiffDepth`（デフォルト: `1`）を使い `HEAD~N..HEAD` で比較します。変更が複数コミットにまたがる場合は、config の `baseBranchDiffDepth` または CLI の `--base-branch-diff-depth` で値を増やしてください。
- ベースラインが見つからない:
  - `storywright test` 前に `download` を実行しているか確認。
- レポート統合でファイルが見つからない:
  - シャード summary の保存先と `--from` glob を確認。
- `master` ブランチを使用している場合:
  - Storywright のデフォルトは `baseBranch: 'main'` です。`master` を使用するリポジトリでは `storywright.config.ts` で明示的に設定してください:
    ```ts
    export default defineConfig({
      diffDetection: {
        baseBranch: "master",
      },
    });
    ```
    CI ワークフローのブランチフィルターも合わせて変更してください。
