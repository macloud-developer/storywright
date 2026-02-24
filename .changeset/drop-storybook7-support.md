---
"@storywright/cli": minor
---

BREAKING: Drop Storybook 7 support and raise minimum Node.js to 20

- Remove `compatibility: 'v7'` option (only `'auto' | 'v8'` supported)
- Remove Storybook 7 `stories` key normalization from index.json parser
- Raise minimum Node.js version from 18 to 20 across all packages
- Storywright now requires Storybook 8 or later
