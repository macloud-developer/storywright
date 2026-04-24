# @storywright/notifier-github

## 1.1.2

### Patch Changes

- [`b1ec4b9`](https://github.com/macloud-developer/storywright/commit/b1ec4b9bb15b2688efb0ad28c5f9425539793500) Thanks [@kubotak-is](https://github.com/kubotak-is)! - fix: remove diff ratio percentage display (was always 0.0%)

  The Playwright reporter hardcoded `diffRatio: 0` for every entry, so every diff was shown as `0.0%` across the HTML report (card badge, sidebar meta line), CLI reporter, and GitHub PR comment table. Remove the percentage display and the Diff column in the PR comment until we actually compute the ratio.

- Updated dependencies [[`b1ec4b9`](https://github.com/macloud-developer/storywright/commit/b1ec4b9bb15b2688efb0ad28c5f9425539793500)]:
  - @storywright/cli@1.6.2

## 1.1.1

### Patch Changes

- [`9f9f7b1`](https://github.com/macloud-developer/storywright/commit/9f9f7b15e470754091899c468b3933b6fdeafc7c) Thanks [@kubotak-is](https://github.com/kubotak-is)! - feat(notifier-github): translate PR comment to English and add emoji accents

  The GitHub PR comment is now fully English (previously mixed Japanese and English) and uses emoji accents for better visual hierarchy: 📸 for the report title, ✅/🔴/💥 for status, 📋/✅/✨/❌/⏭️ for the counts table, 🌐/⏱️ for browser/duration, 🔍 for the diff list, and 🔗 for the report link.

- Updated dependencies []:
  - @storywright/cli@1.6.1

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
