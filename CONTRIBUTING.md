# Contributing

## 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/macloud-developer/storywright.git
cd storywright

# 依存関係のインストール (pnpm 9.x 必須)
corepack enable
pnpm install
```

### 要件

- Node.js >= 20
- pnpm 9.x (`packageManager` フィールドで固定)

## プロジェクト構成

```
packages/
  @storywright/cli       # メインパッケージ (CLI + Programmatic API)
  @storywright/report    # HTML レポートビューア (Svelte)
  @storywright/storage-s3 # S3 ストレージアダプター
```

## 開発ワークフロー

### ビルド

```bash
pnpm build          # 全パッケージをビルド
```

### Push 前の確認事項

**CI と同じチェックがローカルで通ることを必ず確認してください。**

```bash
pnpm lint            # Biome による lint / format チェック
pnpm build           # 全パッケージのビルド (typecheck の前に必要)
pnpm typecheck       # TypeScript 型チェック
pnpm test            # Vitest によるユニットテスト
```

> **重要:** `typecheck` は `build` の生成物 (`.d.ts`) に依存するため、必ず `build` の後に実行してください。

lint エラーがある場合は自動修正できます:

```bash
pnpm lint:fix        # Biome で自動修正
```

### まとめて実行

```bash
pnpm lint && pnpm build && pnpm typecheck && pnpm test
```

## コーディング規約

- フォーマッター/リンター: [Biome](https://biomejs.dev/)
- `pnpm lint:fix` で自動整形されるため、手動で調整する必要はほぼありません
- インデント: タブ
- 引用符: シングルクォート

## リリース

このプロジェクトは [Changesets](https://github.com/changesets/changesets) を使ったバージョン管理・リリースを行っています。

### 1. Changeset ファイルの作成

変更を加えたら、changeset ファイルを作成してコミットに含めます:

```bash
pnpm changeset
```

対話的に以下を選択します:

- **対象パッケージ**: 変更があったパッケージ
- **バンプ種別**: `patch` (バグ修正) / `minor` (機能追加) / `major` (破壊的変更)
- **変更の要約**: CHANGELOG に記載される説明文

`.changeset/` ディレクトリに `.md` ファイルが生成されるので、コードと一緒にコミットしてください。

### 2. CI による自動リリース

main ブランチに push (またはPRマージ) すると:

1. `release.yml` が changeset ファイルを検知
2. **「chore: version packages」PR** が自動作成される (バージョン更新 + CHANGELOG 生成)
3. その PR をマージすると **npm publish** が自動実行される

手動で `changeset version` や `npm publish` を実行する必要はありません。

### バージョニングルール

- `@storywright/cli` と `@storywright/report` は [linked](https://github.com/changesets/changesets/blob/main/docs/linked-packages.md) — 同じバージョンに揃えられます
- `@storywright/storage-s3` は独立してバージョニングされます
