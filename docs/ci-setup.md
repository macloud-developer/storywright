# CI Setup Guide

[日本語版はこちら](./ci-setup.ja.md)

This guide explains how to run Storywright in CI/CD pipelines.

## Prerequisites

- Node.js >= 20
- Storybook >= 8
- `@playwright/test` installed in your project
- Storybook build must produce `index.json` (typically in `storybook-static/`)
- For `--diff-only`, CI checkout must include git history (`fetch-depth: 0`)

## Storage Strategies

### Local storage (default, no S3 required)

With the default local storage strategy, baselines are committed to git. No external storage (S3) is needed.

**Workflow:**

1. Developer changes UI locally
2. Run `npx storywright update` to regenerate baseline screenshots
3. Commit the updated baselines along with code changes
4. CI runs `npx storywright test` — baselines come from git
5. Reviewers see screenshot diffs directly in the PR on GitHub

> **Tip:** If a developer forgets to update baselines after a UI change, CI will detect the mismatch and fail. This acts as a safety net.

> **`.gitignore` setup:** Only `.storywright/tmp/` and `.storywright/report/` should be ignored. `.storywright/baselines/` must be tracked by git. Running `npx storywright init` on a new project sets this up automatically. For existing projects that already have `.storywright/` in `.gitignore`, replace it with `.storywright/tmp/` and `.storywright/report/` manually.

### S3 storage

For large projects or when committing baselines to git is impractical, use the S3 adapter. See the [AWS baseline sync](#aws-baseline-sync-with-oidc-recommended) section.

## Recommended Flow

```text
Build Storybook -> Run Storywright -> Upload report artifacts
```

> For S3 storage, add a "Download baselines" step before running Storywright.

Keep these artifacts:

- `.storywright/report/index.html`
- `.storywright/report/summary.json`
- `.storywright/report/assets/**`

---

## GitHub Actions

### Basic workflow (local storage)

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

      - name: Install Playwright browser
        run: npx playwright install --with-deps chromium

      - name: Build Storybook
        run: npx storybook build --stats-json

      - name: Run Storywright
        run: npx storywright test

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: storywright-report
          path: .storywright/report/
          retention-days: 14
```

### Faster PR checks with `--diff-only`

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0

- name: Run Storywright (diff-only)
  run: npx storywright test --diff-only
```

### Sharding + merge report

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

      - name: Run shard
        run: npx storywright test --shard ${{ matrix.shard }}/4

      - name: Upload shard report
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

      - name: Download shard reports
        uses: actions/download-artifact@v4
        with:
          pattern: storywright-shard-*
          path: .storywright/shards

      - name: Merge summaries and regenerate HTML
        run: npx storywright report --merge --from ".storywright/shards/*/summary.json"

      - name: Upload merged report
        uses: actions/upload-artifact@v4
        with:
          name: storywright-report
          path: .storywright/report/
          retention-days: 14
```

### AWS baseline sync with OIDC (recommended)

Use GitHub OIDC instead of long-lived AWS keys.

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: actions/checkout@v4

  - name: Configure AWS credentials (OIDC)
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/<ROLE_NAME>
      aws-region: ap-northeast-1

  - name: Download baselines
    run: npx storywright download --branch main

  - name: Run Storywright
    run: npx storywright test

  - name: Update and upload baselines (main only)
    if: github.ref == 'refs/heads/main'
    run: npx storywright update --upload
```

Notes:

- The IAM role trust policy must trust `token.actions.githubusercontent.com`.
- Scope trust conditions to your org/repo/branch as tightly as possible.

---

## CircleCI

### Basic workflow

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

### `--diff-only` on CircleCI

```yaml
- checkout
- run: git fetch --prune --unshallow || true
- run: npx storywright test --diff-only
```

### Sharding + merge report

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
          name: Run shard
          command: |
            SHARD_INDEX=$((CIRCLE_NODE_INDEX + 1))
            SHARD_TOTAL=$CIRCLE_NODE_TOTAL
            npx storywright test --shard ${SHARD_INDEX}/${SHARD_TOTAL}
      - run:
          name: Save shard summary for merge job
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
          name: Merge summaries and regenerate HTML
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

### AWS baseline sync on CircleCI

Two options:

1. Use CircleCI context/project environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`).
2. Use CircleCI OIDC + AWS STS AssumeRoleWithWebIdentity (recommended if your org uses OIDC).

Then run:

```yaml
- run: npx storywright download --branch main
- run: npx storywright test
```

---

## Updating Baselines on Main Merge

When a pull request is merged into `main`, baselines should be updated so that subsequent PRs compare against the latest approved state.

By default, `storywright update` only re-captures screenshots for stories affected by the diff (i.e., diff-only). Use `--all` to force a full re-capture of every story.

> **Important:** When running on the base branch (e.g. `main`), `git merge-base main HEAD` returns `HEAD` itself, which means the diff is empty and no stories are detected as changed. Storywright handles this automatically using `baseBranchDiffDepth` (default: `1`), which compares `HEAD~N..HEAD` instead. If your merge commits include multiple parents, increase this value via config or CLI (`--base-branch-diff-depth`).

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

      - name: Install Playwright browser
        run: npx playwright install --with-deps chromium

      - name: Build Storybook
        run: npx storybook build --stats-json

      - name: Download current baselines
        run: npx storywright download --branch main

      - name: Update baselines (diff-only)
        run: npx storywright update --upload
```

> **Note:** `storywright update` (without `--all`) only re-captures stories that changed since the last baseline. To force a full re-capture, use `npx storywright update --all --upload`.

> **Tip:** Adjust `--base-branch-diff-depth` to control how many commits back to compare on the base branch. The default is `1`. Increase this if your merge strategy produces commits that span more history (e.g., squash merges with large changesets).

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

## Exit Codes

| Code  | Meaning                      | CI Interpretation    |
| ----- | ---------------------------- | -------------------- |
| `0`   | Success (no diffs)           | Pass                 |
| `1`   | Success with visual diffs    | Fail (review report) |
| `2`   | Execution/runtime error      | Fail (check logs)    |
| `130` | Interrupted (SIGINT/SIGTERM) | Fail/canceled        |

## CI-oriented Config Example

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
    baseBranchDiffDepth: 1, // commits to compare when running on base branch
  },
  workers: "auto",
});
```

## Troubleshooting

- `aws-cli/install` orb fails with "unzip: not found" on Playwright Docker image:
  - The Playwright Docker image (`mcr.microsoft.com/playwright:*-noble`) does not include `unzip`. Install it before the orb step:
    ```yaml
    - run: apt-get update && apt-get install -y unzip
    ```
  - Alternatively, use the `aws-cli` orb's built-in install or pre-install AWS CLI in a custom Docker image.
- `--diff-only` runs all stories unexpectedly:
  - Verify git history is available and `baseBranch` is correct in `storywright.config.ts`.
- Diff-only detects no changes on the base branch (e.g. `main`):
  - On the base branch, `merge-base` returns `HEAD`, resulting in an empty diff. Storywright uses `baseBranchDiffDepth` (default: `1`) to compare `HEAD~N..HEAD` instead. If your changes span more commits, increase `baseBranchDiffDepth` in config or use `--base-branch-diff-depth` on the CLI.
- No baselines found:
  - Ensure `download` runs before `storywright test`.
- Report merge found no files:
  - Confirm shard summary path and `--from` glob.
- Using `master` instead of `main`:
  - Storywright defaults to `baseBranch: 'main'`. If your repository uses `master`, set it explicitly in `storywright.config.ts`:
    ```ts
    export default defineConfig({
      diffDetection: {
        baseBranch: "master",
      },
    });
    ```
    Also update CI workflow branch filters accordingly.
