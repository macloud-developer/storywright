# @storywright/notifier-github

<p>
  <a href="https://www.npmjs.com/package/@storywright/notifier-github"><img src="https://img.shields.io/npm/v/@storywright/notifier-github.svg" alt="npm version"></a>
  <a href="https://github.com/macloud-developer/storywright/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@storywright/notifier-github.svg" alt="license"></a>
</p>

> GitHub PR comment notifier for [Storywright](https://github.com/macloud-developer/storywright)

Post Storywright visual regression test results as a GitHub pull request comment. Automatically detects your CI environment and upserts a single comment per PR.

## Features

- **Upsert comments** — Updates an existing comment via a hidden marker instead of creating duplicates
- **CI auto-detection** — GitHub Actions, CircleCI, and generic environment variables
- **Diff summary** — Markdown table of failed stories with diff ratios
- **Conditional posting** — `always`, `on-diff`, or `on-error` trigger modes
- **Collapse / delete on pass** — Keep the PR timeline tidy when all tests pass
- **Report URL support** — Link to the hosted HTML report from the comment

## Installation

```bash
npm install -D @storywright/notifier-github
```

**Peer dependency:** `@storywright/cli`

## Quick Start

After running `storywright test`, post results to the PR:

```bash
npx storywright test
npx storywright notify github
```

The CLI auto-detects your CI environment (token, repository, PR number) and posts a comment with the test summary.

## Configuration

Configure the notifier in `storywright.config.ts` so it runs automatically after `storywright test`:

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
| `prNumber`       | `number`  | Auto-detected | Pull request number                     |
| `maxEntries`     | `number`  | `10`          | Max diff entries shown in the comment   |
| `collapseOnPass` | `boolean` | `true`        | Collapse details when all tests pass    |
| `deleteOnPass`   | `boolean` | `false`       | Delete the comment when all tests pass  |
| `reportUrl`      | `string`  | From config   | Override report URL                     |
| `when`           | `string`  | `"always"`    | `"always"` / `"on-diff"` / `"on-error"` |

## CLI Usage

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
```

## CI Environment Auto-Detection

| CI Provider        | Token                      | Repository                         | PR Number               |
| ------------------ | -------------------------- | ---------------------------------- | ----------------------- |
| **GitHub Actions** | `GITHUB_TOKEN` (auto)      | `GITHUB_REPOSITORY`                | `GITHUB_REF`            |
| **CircleCI**       | `GITHUB_TOKEN` (manual)    | `CIRCLE_PROJECT_USERNAME/REPONAME` | `CIRCLE_PULL_REQUEST`   |
| **Generic**        | `STORYWRIGHT_GITHUB_TOKEN` | `STORYWRIGHT_GITHUB_REPO`          | `STORYWRIGHT_PR_NUMBER` |

## Required Permissions

| CI Provider        | Requirement            | Setup                                    |
| ------------------ | ---------------------- | ---------------------------------------- |
| **GitHub Actions** | `pull-requests: write` | `permissions` in workflow YAML           |
| **CircleCI**       | PAT with `repo` scope  | Project Settings > Environment Variables |
| **Other**          | PAT with `repo` scope  | `STORYWRIGHT_GITHUB_TOKEN` or `--token`  |

## Documentation

See the [Notifications guide](https://github.com/macloud-developer/storywright/blob/main/docs/notifications.md) for report URL templates, CI examples, and troubleshooting.

## License

MIT
