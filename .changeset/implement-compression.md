---
"@storywright/storage-s3": minor
"@storywright/cli": patch
---

Implement tar.zst/tar.gz archive compression for S3 storage adapter

- Upload: bundle files into a single tar archive, compress with zstd or gzip, multipart upload via `@aws-sdk/lib-storage`
- Download: auto-detect compression from file extension, decompress and extract; falls back to individual file download for backward compatibility
- Add `--shard` option to `upload` command for shard-aware archive naming
- Clean up stale archives when shard count or compression format changes
