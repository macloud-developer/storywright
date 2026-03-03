---
"@storywright/cli": patch
"@storywright/storage-s3": patch
---

Fix CI timeout during update and add S3 transfer progress logging

- Skip unnecessary baseline download during `storywright update` (fixes CircleCI no-output timeout)
- Add `onProgress` callback to `DownloadOptions` / `UploadOptions` for S3 transfer progress
- S3 adapter now logs progress for archive download/extract, individual file transfers, and archive compression/upload
