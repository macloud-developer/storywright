---
"@storywright/cli": patch
---

fix(core): preserve baselines outside the diff during diff-only `update`

`storywright update` (diff-only, the default without `--all`) previously
skipped downloading existing baselines, so only the changed stories were
written to `baselineDir` and uploaded. With archive storage this replaced the
stored baseline with diff-only content (or, when uploaded per-shard, let
shard archives overwrite each other), so updates were effectively lost.

Now a diff-only `update` downloads the existing baseline first. Playwright's
`--update-snapshots` only rewrites the stories that ran, so stories outside
the diff are preserved and re-uploaded intact. Full updates (`--all`) still
skip the download and regenerate every story from scratch.

Also warns when running `update --upload --shard` in diff-only mode, since
per-shard archive uploads can overwrite other shards' baselines (prefer a
single aggregated upload or `compression: 'none'`).
