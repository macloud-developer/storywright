# @storywright/storage-s3

## 1.1.0

### Minor Changes

- [`f46dcf3`](https://github.com/macloud-developer/storywright/commit/f46dcf33451a4699aa8d7443082f00269d5b82fa) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Implement tar.zst/tar.gz archive compression for S3 storage adapter

  - Upload: bundle files into a single tar archive, compress with zstd or gzip, multipart upload via `@aws-sdk/lib-storage`
  - Download: auto-detect compression from file extension, decompress and extract; falls back to individual file download for backward compatibility
  - Add `--shard` option to `upload` command for shard-aware archive naming
  - Clean up stale archives when shard count or compression format changes

### Patch Changes

- Updated dependencies [[`2160b8c`](https://github.com/macloud-developer/storywright/commit/2160b8c941150ef9b737b6765e6db5e7f89e1263), [`f46dcf3`](https://github.com/macloud-developer/storywright/commit/f46dcf33451a4699aa8d7443082f00269d5b82fa)]:
  - @storywright/cli@0.5.4

## 1.0.2

### Patch Changes

- [`d6d00e8`](https://github.com/macloud-developer/storywright/commit/d6d00e8d743abf5ba68ab52434ec476acef87518) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix S3 download missing files when >1000 objects exist by adding ListObjectsV2 pagination

## 1.0.1

### Patch Changes

- [`bedda3c`](https://github.com/macloud-developer/storywright/commit/bedda3c12372a7912ee770f1e35e8894c0a2a247) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix peerDependencies to accept any version of @storywright/cli

## 1.0.0

### Patch Changes

- Updated dependencies [[`ee53ae3`](https://github.com/macloud-developer/storywright/commit/ee53ae3ab8e4771defa2cbac2b8e9510bcd66c48)]:
  - @storywright/cli@0.2.0
