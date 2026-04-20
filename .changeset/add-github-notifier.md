---
"@storywright/cli": minor
"@storywright/notifier-github": minor
---

feat: add GitHub PR comment notification for VRT results

Add `@storywright/notifier-github` package and notification infrastructure to post VRT results as GitHub PR comments. Supports GitHub Actions, CircleCI, and generic CI environments.

- `storywright notify github` CLI subcommand with dry-run support
- Automatic notification after `storywright test` via `config.notifiers`
- Report URL template resolution with `${prNumber}`, `${branch}`, `${sha}` variables
- `on-diff` / `on-error` / `always` notification conditions
- Comment upsert with pagination (no duplicates)
- `collapseOnPass` option to fold details when all tests pass
