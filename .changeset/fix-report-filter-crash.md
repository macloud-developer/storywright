---
"@storywright/report": patch
---

fix(report): prevent crash and stale content when filter drastically reduces entry count

When switching filters (e.g. Pass → Diff) on reports where the entry counts differ significantly, the virtual scroll's cached items would reference indices beyond the new entries array. This caused `TypeError: Cannot read properties of undefined (reading 'type')` during render and left the old list visible. Template now guards with `{#if entry}`, and the sidebar resets its scroll position on entries change (matching the main card list).
