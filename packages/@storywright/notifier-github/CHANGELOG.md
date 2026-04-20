# @storywright/notifier-github

## 1.1.0

### Minor Changes

- [`3517955`](https://github.com/macloud-developer/storywright/commit/3517955c6eab3079d09a0c44969ba03ab2185029) Thanks [@kubotak-is](https://github.com/kubotak-is)! - feat: add GitHub PR comment notification for VRT results

  Add `@storywright/notifier-github` package and notification infrastructure to post VRT results as GitHub PR comments. Supports GitHub Actions, CircleCI, and generic CI environments.
  - `storywright notify github` CLI subcommand with dry-run support
  - Automatic notification after `storywright test` via `config.notifiers`
  - Report URL template resolution with `${prNumber}`, `${branch}`, `${sha}` variables
  - `on-diff` / `on-error` / `always` notification conditions
  - Comment upsert with pagination (no duplicates)
  - `collapseOnPass` option to fold details when all tests pass

### Patch Changes

- Updated dependencies [[`3517955`](https://github.com/macloud-developer/storywright/commit/3517955c6eab3079d09a0c44969ba03ab2185029)]:
  - @storywright/cli@1.6.0
