<p align="center">
  <img src="./storywright.svg" alt="Storywright" width="400" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@storywright/cli"><img src="https://img.shields.io/npm/v/@storywright/cli.svg" alt="npm version"></a>
  <a href="https://github.com/macloud-developer/storywright/actions/workflows/ci.yml"><img src="https://github.com/macloud-developer/storywright/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/macloud-developer/storywright/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@storywright/cli.svg" alt="license"></a>
</p>

> Self-hosted visual regression testing powered by Storybook + Playwright

[日本語版 README](./README_ja.md)

Storywright captures screenshots from Storybook stories, compares them with baselines, and reports visual regressions.

![Storywright Report](packages/@storywright/report/screenshot.png)

## Packages

| Package                                                       | Description                   |
| ------------------------------------------------------------- | ----------------------------- |
| [@storywright/cli](./packages/@storywright/cli)               | Core CLI and programmatic API |
| [@storywright/report](./packages/@storywright/report)         | Svelte HTML report viewer     |
| [@storywright/storage-s3](./packages/@storywright/storage-s3) | AWS S3 storage adapter        |

## Features

- Quick start with `npx @storywright/cli test`
- Diff-only test selection from git changes
- Multi-browser execution (Chromium, Firefox, WebKit)
- HTML report generation (`summary.json` + `index.html`)
- Baseline storage: local filesystem or S3 adapter
- CI-friendly workflow with sharding and merge report

## Requirements

- Node.js `>=20`
- Storybook `>=8` (recommended)
- Playwright `>=1.40`

## Quick Start

```bash
npm install -D @storywright/cli @playwright/test
npx playwright install --with-deps chromium
npx storywright test
```

Default outputs:

- Report: `.storywright/report/index.html`
- Summary: `.storywright/report/summary.json`
- Temp artifacts: `.storywright/tmp`

## Configuration

Generate a starter config:

```bash
npx storywright init
```

Example:

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
    baseBranchDiffDepth: 1, // commits to compare when running on base branch
    watchFiles: ["package.json", "package-lock.json", ".storybook/**/*"],
  },

  storage: {
    provider: "local", // local | s3
    branch: "main", // branch name for baseline storage
    local: {
      baselineDir: ".storywright/baselines",
    },
  },

  report: {
    outputDir: ".storywright/report",
    title: "Storywright Report",
  },

  workers: "auto", // number | 'auto'
  retries: 0, // retry count for flaky tests

  timeout: {
    test: 30000, // per-test timeout (ms)
    navigation: 20000, // page navigation timeout (ms)
    expect: 10000, // assertion timeout (ms)
  },

  include: ["**"],
  exclude: ["**/Experimental/**"],

  hooks: {
    beforeScreenshot: async (page, story) => {
      // e.g. dismiss cookie banners
    },
    afterScreenshot: async (page, story) => {
      // e.g. cleanup
    },
  },
});
```

## CLI

### `storywright test`

Run visual regression tests.

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

Main options:

- `--browsers`: comma-separated browser projects
- `--diff-only`: run only affected stories from git diff
- `--full-page`: take full page screenshots (`true` or `false`)
- `--shard`: shard format `index/total`
- `--workers`: number of parallel workers (`auto` or number)
- `--threshold`: per-pixel color threshold
- `--max-diff-pixel-ratio`: allowed diff ratio
- `--filter`: story filter glob
- `--output-dir`: output root (when set, report is `<output-dir>/report`)
- `--reporters`: comma-separated Playwright reporters (`default`, `html`, `dot`, `json`, ...)
- `--storybook-url`: use already running Storybook
- `--storybook-dir`: static Storybook directory
- `--retries`: retry count for failed tests
- `--update-snapshots`: update baselines
- `--base-branch-diff-depth`: number of commits to compare when on the base branch (default: `1`)

### `storywright update`

Update baseline snapshots. Supports the same parallel options as `test`.

```bash
npx storywright update
npx storywright update --all
npx storywright update --upload
npx storywright update --shard 1/4
npx storywright update --workers 4
npx storywright update --browsers chromium,webkit
npx storywright update --filter "Components/**"
```

- `--all`: regenerate all baselines (skip diff detection)
- `--upload`: upload baselines to remote storage after update
- `--shard`: shard format `index/total`
- `--workers`: number of parallel workers (`auto` or number)
- `--browsers`: comma-separated browser projects
- `--filter`: filter stories by glob pattern
- `--retries`: retry count for failed tests
- `--base-branch-diff-depth`: number of commits to compare when on the base branch (default: `1`)

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

`--merge` creates merged `summary.json` and regenerates `index.html`.

### `storywright init`

```bash
npx storywright init
```

## Filtering Stories

Use `include` / `exclude` glob patterns in `storywright.config.ts` to control which stories are tested. Patterns are matched against the full story name (`Component/StoryName`).

```ts
export default defineConfig({
  include: ["**"], // test all stories (default)
  exclude: ["**/Experimental/**"], // skip stories matching this pattern
});
```

## Exit Codes

- `0`: success (no diffs)
- `1`: success with visual diffs
- `2`: execution error
- `130`: interrupted

## Baseline Storage

### Local storage (default)

By default, baselines are stored in `.storywright/baselines/` and should be committed to git. No external storage is needed.

```bash
# Update baselines after UI changes
npx storywright update

# Commit baselines with your code
git add .storywright/baselines/
git commit -m "update VRT baselines"
```

> Ensure `.storywright/baselines/` is **not** in `.gitignore`. Only `.storywright/tmp/` and `.storywright/report/` should be ignored.

### S3 Adapter

Install adapter package:

```bash
npm install -D @storywright/storage-s3
```

Config example:

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

## Programmatic API

```ts
import { createStorywright } from "@storywright/cli";

const sw = await createStorywright({
  browsers: ["chromium"],
});

const result = await sw.test({ diffOnly: true });
// result: { exitCode, summary?, reportDir?, snapshotDir? }
console.log(result.exitCode, result.summary, result.reportDir);

// Format summary as a human-readable string
const report = sw.generateReport(result);
if (report) console.log(report);

await sw.update({ all: false });
await sw.upload();
await sw.download({ branch: "main" });
```

## CI Guide

- [CI Setup Guide](./docs/ci-setup.md)

## License

MIT
