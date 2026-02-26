---
"@storywright/cli": patch
"@storywright/report": patch
---

Fix report crash when retries produce duplicate failure entries

- Reporter now keeps only the final retry result per test (Map instead of array)
- DiffCardList uses unique keys to prevent Svelte duplicate key errors
