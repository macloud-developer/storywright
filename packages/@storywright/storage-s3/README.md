# @storywright/storage-s3

<p>
  <a href="https://www.npmjs.com/package/@storywright/storage-s3"><img src="https://img.shields.io/npm/v/@storywright/storage-s3.svg" alt="npm version"></a>
  <a href="https://github.com/macloud-developer/storywright/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@storywright/storage-s3.svg" alt="license"></a>
</p>

> AWS S3 storage adapter for [Storywright](https://github.com/macloud-developer/storywright)

Store and retrieve visual regression baselines on Amazon S3. Supports compressed archives and sharded uploads for fast CI pipelines.

## Features

- **Compressed archives** — zstd (default) or gzip for fast transfers
- **Shard support** — Parallel uploads from multiple CI runners
- **Automatic cleanup** — Removes stale archives on format or shard count changes
- **Backward compatible** — Falls back to individual file download for older baselines
- **Server-side encryption** — AES-256 for all uploads

## Installation

```bash
npm install -D @storywright/storage-s3
```

**Peer dependency:** `@storywright/cli`

## Configuration

In `storywright.config.ts`:

```ts
import { defineConfig } from "@storywright/cli";

export default defineConfig({
  storage: {
    provider: "s3",
    branch: "main",
    s3: {
      bucket: "my-vrt-baselines",
      prefix: "storywright/baselines",
      region: "ap-northeast-1",
      compression: "zstd", // "zstd" | "gzip" | "none"
    },
  },
});
```

| Option        | Default                   | Description                                    |
| ------------- | ------------------------- | ---------------------------------------------- |
| `bucket`      | —                         | S3 bucket name (required)                      |
| `prefix`      | `"storywright/baselines"` | Key prefix within the bucket                   |
| `region`      | `"ap-northeast-1"`        | AWS region                                     |
| `compression` | `"zstd"`                  | Archive compression: `zstd`, `gzip`, or `none` |

## Usage

```bash
# Upload baselines to S3
npx storywright upload

# Upload with sharding (from CI runner 1 of 3)
npx storywright upload --shard 1/3

# Download baselines from S3
npx storywright download

# Download from a specific branch
npx storywright download --branch feature/new-ui
```

## S3 Object Layout

```
s3://my-bucket/storywright/baselines/main/
  __archives__/
    baselines.tar.zst          # Non-shard mode
    shard-1-of-3.tar.zst       # Shard mode
    shard-2-of-3.tar.zst
    shard-3-of-3.tar.zst
```

When `compression: "none"`, files are stored individually:

```
s3://my-bucket/storywright/baselines/main/
  Button/button--primary-chromium.png
  Card/card--default-chromium.png
  ...
```

## IAM Policy

Minimum required permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::my-vrt-baselines",
      "Condition": {
        "StringLike": {
          "s3:prefix": "storywright/baselines/*"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::my-vrt-baselines/storywright/baselines/*"
    }
  ]
}
```

## CI Example (GitHub Actions + OIDC)

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/storywright-ci
    aws-region: ap-northeast-1

- run: npx storywright test
```

See the [CI Setup Guide](https://github.com/macloud-developer/storywright/blob/main/docs/ci-setup.md) for full workflow examples.

## License

MIT
