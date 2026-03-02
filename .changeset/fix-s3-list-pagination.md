---
"@storywright/storage-s3": patch
---

Fix S3 download missing files when >1000 objects exist by adding ListObjectsV2 pagination
