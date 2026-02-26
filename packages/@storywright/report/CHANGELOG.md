# @storywright/report

## 0.4.1

### Patch Changes

- [`b7f9450`](https://github.com/macloud-developer/storywright/commit/b7f9450cb8bbff1357e02de679a19bde1165d322) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix report crash when retries produce duplicate failure entries

  - Reporter now keeps only the final retry result per test (Map instead of array)
  - DiffCardList uses unique keys to prevent Svelte duplicate key errors
