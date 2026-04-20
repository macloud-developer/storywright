# Notifications

[日本語版はこちら](./notifications.ja.md)

Post VRT results to GitHub pull requests (and more) after test runs.

## Prerequisites

- Node.js >= 20
- `@storywright/cli` installed
- `@storywright/notifier-github` installed for GitHub PR comments

```bash
pnpm add -D @storywright/notifier-github
```

## Quick Start

After running `storywright test`, post results to the PR:

```bash
npx storywright test
npx storywright notify github
```

The CLI auto-detects your CI environment (GitHub Actions, CircleCI) and posts a comment with the test summary.

## Report URL Template

Configure a URL template in `storywright.config.ts` so that notifications automatically include a link to the report:

```ts
import { defineConfig } from "@storywright/cli";

export default defineConfig({
  report: {
    url: "https://cdn.example.com/${prNumber}/vrt/report/index.html",
  },
});
```

### Template Variables

| Variable       | Description                | Example             |
| -------------- | -------------------------- | ------------------- |
| `${prNumber}`  | Pull request number        | `123`               |
| `${branch}`    | Branch name (URL-encoded)  | `feat%2Fnew-button` |
| `${sha}`       | Full commit SHA            | `abc123def456...`   |
| `${shortSha}`  | Short commit SHA (7 chars) | `abc123d`           |
| `${timestamp}` | ISO timestamp (compact)    | `20260419T120000`   |

Variables are resolved from CI environment variables or CLI arguments.

### Priority

1. `--report-url` CLI argument (literal URL, no template expansion)
2. `report.url` in config (template expanded with CI context)
3. Omitted (no link in the comment)

## GitHub PR Comment

### How It Works

1. Builds a Markdown summary from `summary.json`
2. Searches the PR for an existing Storywright comment (via hidden marker)
3. Updates the existing comment or creates a new one (upsert)

### CLI Usage

```bash
# Auto-detect CI environment
npx storywright notify github

# Explicit options
npx storywright notify github \
  --token "$GITHUB_TOKEN" \
  --repo "owner/repo" \
  --pr 123 \
  --report-url "https://cdn.example.com/report"

# Preview without posting
npx storywright notify github --dry-run

# Custom summary.json path (e.g., after merge)
npx storywright notify github --from ".storywright/report/summary.json"
```

### CLI Arguments

| Argument        | Description                                  | Default                            |
| --------------- | -------------------------------------------- | ---------------------------------- |
| `--token`       | GitHub token                                 | Auto-detected                      |
| `--repo`        | Repository (`owner/repo`)                    | Auto-detected                      |
| `--pr`          | Pull request number                          | Auto-detected                      |
| `--report-url`  | Report URL (overrides config template)       | —                                  |
| `--from`        | Path to `summary.json`                       | `.storywright/report/summary.json` |
| `--dry-run`     | Print markdown to stdout                     | `false`                            |
| `--max-entries` | Max diff entries shown                       | `10`                               |
| `--when`        | Condition: `always` / `on-diff` / `on-error` | `always`                           |

### CI Environment Auto-Detection

| CI Provider        | Token                      | Repository                         | PR Number               |
| ------------------ | -------------------------- | ---------------------------------- | ----------------------- |
| **GitHub Actions** | `GITHUB_TOKEN` (auto)      | `GITHUB_REPOSITORY`                | `GITHUB_REF`            |
| **CircleCI**       | `GITHUB_TOKEN` (manual)    | `CIRCLE_PROJECT_USERNAME/REPONAME` | `CIRCLE_PULL_REQUEST`   |
| **Generic**        | `STORYWRIGHT_GITHUB_TOKEN` | `STORYWRIGHT_GITHUB_REPO`          | `STORYWRIGHT_PR_NUMBER` |

### Required Permissions

| CI Provider        | Requirement            | Setup                                    |
| ------------------ | ---------------------- | ---------------------------------------- |
| **GitHub Actions** | `pull-requests: write` | `permissions` in workflow YAML           |
| **CircleCI**       | PAT with `repo` scope  | Project Settings > Environment Variables |
| **Other**          | PAT with `repo` scope  | `STORYWRIGHT_GITHUB_TOKEN` or `--token`  |

## CI Examples

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
          name: Notify PR
          command: npx storywright notify github --report-url "https://cdn.example.com/${PR_ID}/report"
          when: always
      - store_artifacts:
          path: .storywright/report
          destination: storywright-report
```

## Programmatic API

Configure notifiers in `storywright.config.ts` for automatic notification after `storywright test`:

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

### Options

| Option           | Type      | Default       | Description                             |
| ---------------- | --------- | ------------- | --------------------------------------- |
| `token`          | `string`  | Auto-detected | GitHub token                            |
| `repository`     | `string`  | Auto-detected | `owner/repo`                            |
| `prNumber`       | `number`  | Auto-detected | PR number                               |
| `maxEntries`     | `number`  | `10`          | Max diff entries in comment             |
| `collapseOnPass` | `boolean` | `true`        | Collapse details when all pass          |
| `deleteOnPass`   | `boolean` | `false`       | Delete comment when all pass            |
| `reportUrl`      | `string`  | From config   | Override report URL                     |
| `when`           | `string`  | `"always"`    | `"always"` / `"on-diff"` / `"on-error"` |

## Troubleshooting

- **"GitHub environment not detected"**: Token, repository, or PR number could not be resolved. Use `--token`, `--repo`, and `--pr` explicitly.
- **"@storywright/notifier-github package not found"**: Install it with `pnpm add -D @storywright/notifier-github`.
- **403 from GitHub API**: Ensure the token has `pull-requests: write` permission (GitHub Actions) or `repo` scope (PAT).
- **Duplicate comments**: The notifier uses a hidden marker (`<!-- storywright-report -->`) to find and update existing comments. If you see duplicates, check that the marker was not removed manually.
