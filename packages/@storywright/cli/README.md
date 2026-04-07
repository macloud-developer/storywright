# @storywright/cli

<p>
  <a href="https://www.npmjs.com/package/@storywright/cli"><img src="https://img.shields.io/npm/v/@storywright/cli.svg" alt="npm version"></a>
  <a href="https://github.com/macloud-developer/storywright/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@storywright/cli.svg" alt="license"></a>
</p>

> Self-hosted visual regression testing powered by Storybook + Playwright

Storywright captures screenshots from Storybook stories, compares them with baselines, and reports visual regressions.

## Features

- Quick start with `npx @storywright/cli test`
- Diff-only test selection from git changes
- Multi-browser execution (Chromium, Firefox, WebKit)
- HTML report generation (`summary.json` + `index.html`)
- Baseline storage: local filesystem or S3 adapter
- CI-friendly workflow with sharding and merge report
- Configurable hooks (`beforeScreenshot` / `afterScreenshot`)
- Programmatic API for custom integrations

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

Example `storywright.config.ts`:

```ts
import { defineConfig } from "@storywright/cli";

export default defineConfig({
  storybook: {
    staticDir: "storybook-static",
    buildCommand: "npx storybook build --stats-json",
  },
  browsers: ["chromium", "webkit"],
  screenshot: {
    fullPage: true,
    animations: "disabled",
    threshold: 0.02,
    maxDiffPixelRatio: 0.02,
  },
  storage: {
    provider: "local",
    branch: "main",
    local: { baselineDir: ".storywright/baselines" },
  },
});
```

See the [full configuration reference](https://github.com/macloud-developer/storywright#configuration) for all options.

## CLI Commands

### `storywright test`

Run visual regression tests.

```bash
npx storywright test [options]
```

| Option                   | Description                               |
| ------------------------ | ----------------------------------------- |
| `--browsers`             | Browsers to test (comma-separated)        |
| `--diff-only`            | Only test stories affected by git changes |
| `--filter`               | Filter stories by glob pattern            |
| `--shard`                | Shard specification (e.g. `1/3`)          |
| `--workers`              | Number of parallel workers                |
| `--retries`              | Number of retries for failed tests        |
| `--threshold`            | Pixel color threshold (0–1)               |
| `--max-diff-pixel-ratio` | Maximum diff pixel ratio (0–1)            |
| `--storybook-url`        | URL of running Storybook                  |
| `--output-dir`           | Output root directory                     |
| `--reporters`            | Reporters (comma-separated)               |

### `storywright update`

Update baseline snapshots.

```bash
npx storywright update [options]
```

| Option     | Description                                   |
| ---------- | --------------------------------------------- |
| `--all`    | Regenerate all baselines (default: diff-only) |
| `--upload` | Upload baselines after update                 |
| `--filter` | Filter stories by glob pattern                |
| `--shard`  | Shard specification                           |

### `storywright upload`

Upload baselines to remote storage.

```bash
npx storywright upload [--shard 1/3]
```

### `storywright download`

Download baselines from storage.

```bash
npx storywright download [--branch main]
```

### `storywright report`

Generate or open the HTML report.

```bash
npx storywright report [--open] [--merge --from "reports/*/summary.json"]
```

### `storywright init`

Initialize configuration file.

```bash
npx storywright init
```

## Exit Codes

| Code  | Meaning                                      |
| ----- | -------------------------------------------- |
| `0`   | Success — no visual diffs                    |
| `1`   | Success — visual diffs found (review needed) |
| `2`   | Execution error                              |
| `130` | Interrupted (SIGINT / SIGTERM)               |

## Programmatic API

```ts
import { createStorywright } from "@storywright/cli";

const sw = await createStorywright();

const result = await sw.test({ diffOnly: true });
sw.generateReport(result);

if (result.exitCode === 1) {
  console.log("Visual diffs detected");
}
```

## Storage

### Local (default)

Baselines are stored in `.storywright/baselines/` and committed to git.

### S3

Install the S3 adapter:

```bash
npm install -D @storywright/storage-s3
```

```ts
export default defineConfig({
  storage: {
    provider: "s3",
    branch: "main",
    s3: {
      bucket: "my-bucket",
      prefix: "storywright/baselines",
      region: "ap-northeast-1",
      compression: "zstd",
    },
  },
});
```

## CI Setup

See the [CI Setup Guide](https://github.com/macloud-developer/storywright/blob/main/docs/ci-setup.md) for GitHub Actions / CircleCI workflow examples.

## License

MIT
