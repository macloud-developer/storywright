---
"@storywright/report": patch
---

Fix virtual scroll overscan direction and add sidebar virtualization

- Fix overscan to apply more buffer in the scroll direction, preventing blank areas when scrolling down
- Add virtual scroll to Sidebar for large entry lists, reducing DOM nodes from N to ~50
- Adjust card list padding for consistent spacing
