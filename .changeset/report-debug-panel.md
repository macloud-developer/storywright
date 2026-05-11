---
"@storywright/report": minor
---

feat(report): add Debug panel showing summary.json data

A "Debug" button in the report header opens a full-screen panel that
displays the underlying summary.json in two views:

- **Table view** (default): lists every entry with its type (colour-coded),
  story, variant, browser, and the expected / actual / diff file paths.
  Empty paths are shown as `—` for quick scanning.
- **Raw JSON**: the complete summary.json pretty-printed.

The panel is useful when diagnosing reporter issues such as missing
actual images for new stories or unexpected entry types.
