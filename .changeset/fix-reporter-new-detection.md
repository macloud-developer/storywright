---
"@storywright/cli": patch
---

fix(reporter): use expected attachment instead of diff to determine new vs diff status

Previously, the reporter checked for the presence of a "diff" image attachment to
distinguish between "new" and "diff" test entries. This caused tests with existing
baselines to be incorrectly classified as "new" when the diff image was not generated
(e.g., test failure before screenshot comparison). Now checks for "expected" attachment
instead, which reliably indicates that a baseline exists.
