# @storywright/storage-s3

## 1.1.4

### Patch Changes

- Updated dependencies [[`0ff461e`](https://github.com/macloud-developer/storywright/commit/0ff461e545488714eec484dc12b59e4ee3a968c7)]:
  - @storywright/cli@0.5.8

## 1.1.3

### Patch Changes

- Updated dependencies [[`27ea5e3`](https://github.com/macloud-developer/storywright/commit/27ea5e35e96bc9f3edd78dc1ac0b28a41316cd84)]:
  - @storywright/cli@0.5.7

## 1.1.2

### Patch Changes

- Updated dependencies [[`27ea5e3`](https://github.com/macloud-developer/storywright/commit/27ea5e35e96bc9f3edd78dc1ac0b28a41316cd84)]:
  - @storywright/cli@0.5.6

## 1.1.1

### Patch Changes

- [`333db4d`](https://github.com/macloud-developer/storywright/commit/333db4d8615c52cc61bcd86af4e825c322d47e21) Thanks [@kubotak-is](https://github.com/kubotak-is)! - Fix CI timeout during update and add S3 transfer progress logging

  - Skip unnecessary baseline download during `storywright update` (fixes CircleCI no-output timeout)
  - Add `onProgress` callback to `DownloadOptions` / `UploadOptions` for S3 transfer progress
  - S3 adapter now logs progress for archive download/extract, individual file transfers, and archive compression/upload

- Updated dependencies [[`333db4d`](https://github.com/macloud-developer/storywright/commit/333db4d8615c52cc61bcd86af4e825c322d47e21)]:
  - @storywright/cli@0.5.5

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
