# Contributing

## 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/macloud-developer/storywright.git
cd storywright

# Vite+ CLI のインストール (初回のみ)
curl -fsSL https://viteplus.dev/install.sh | bash

# 依存関係のインストール
vp install
```

### 要件

- [Vite+](https://viteplus.dev/) (Node.js とパッケージマネージャを内包)

> **注:** 内部的には pnpm を使用しています (`packageManager` フィールドで固定)。pnpm を直接使う必要はありません。

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
vp run build          # 全パッケージをビルド
```

### Push 前の確認事項

**CI と同じチェックがローカルで通ることを必ず確認してください。**

```bash
vp fmt --check       # フォーマットチェック (oxfmt)
vp run build         # 全パッケージのビルド
vp test              # Vitest によるユニットテスト
```

フォーマットエラーがある場合は自動修正できます:

```bash
vp fmt               # oxfmt で自動整形
```

### Pre-commit フック

コミット時に `vp fmt --check` が自動実行されます。フォーマット違反がある場合はコミットがブロックされます。`vp fmt` で修正してから再度コミットしてください。

## コーディング規約

- フォーマッター: [oxfmt](https://oxc.rs/) (Vite+ 内蔵)
- リンター: [oxlint](https://oxc.rs/) (Vite+ 内蔵)
- `vp fmt` で自動整形されるため、手動で調整する必要はほぼありません

## リリース

このプロジェクトは [Changesets](https://github.com/changesets/changesets) を使ったバージョン管理・リリースを行っています。

### 1. Changeset ファイルの作成

変更を加えたら、changeset ファイルを作成してコミットに含めます:

```bash
vp dlx changeset
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
