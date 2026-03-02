import fs from 'node:fs/promises';
import path from 'node:path';
import {
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import type { DownloadOptions, StorageAdapter, UploadOptions } from '@storywright/cli';

export interface S3StorageAdapterConfig {
	bucket: string;
	prefix: string;
	region: string;
	compression?: 'zstd' | 'gzip' | 'none';
}

export class S3StorageAdapter implements StorageAdapter {
	private client: S3Client;

	constructor(private config: S3StorageAdapterConfig) {
		this.client = new S3Client({ region: config.region });
	}

	async download(options: DownloadOptions): Promise<void> {
		const prefix = this.getPrefix(options.branch);
		const objects = await this.listAllObjects(prefix);

		if (objects.length === 0) {
			return;
		}

		await fs.mkdir(options.destDir, { recursive: true });

		for (const object of objects) {
			if (!object.Key) continue;

			const relativePath = object.Key.slice(prefix.length);
			if (!relativePath) continue;

			const destPath = path.join(options.destDir, relativePath);
			await fs.mkdir(path.dirname(destPath), { recursive: true });

			const getCommand = new GetObjectCommand({
				Bucket: this.config.bucket,
				Key: object.Key,
			});

			const getResult = await this.client.send(getCommand);
			if (getResult.Body) {
				const bytes = await getResult.Body.transformToByteArray();
				await fs.writeFile(destPath, Buffer.from(bytes));
			}
		}
	}

	async upload(options: UploadOptions): Promise<void> {
		const prefix = this.getPrefix(options.branch);
		const files = await this.walkDir(options.sourceDir);

		for (const file of files) {
			const relativePath = path.relative(options.sourceDir, file).replace(/\\/g, '/');
			const key = `${prefix}${relativePath}`;
			const content = await fs.readFile(file);

			const putCommand = new PutObjectCommand({
				Bucket: this.config.bucket,
				Key: key,
				Body: content,
				ContentType: this.getContentType(file),
				ServerSideEncryption: 'AES256',
			});

			await this.client.send(putCommand);
		}
	}

	async exists(branch: string): Promise<boolean> {
		const prefix = this.getPrefix(branch);
		try {
			const command = new ListObjectsV2Command({
				Bucket: this.config.bucket,
				Prefix: prefix,
				MaxKeys: 1,
			});
			const result = await this.client.send(command);
			return (result.Contents?.length ?? 0) > 0;
		} catch {
			return false;
		}
	}

	private getPrefix(branch: string): string {
		return `${this.config.prefix}/${branch}/`;
	}

	private getContentType(filePath: string): string {
		if (filePath.endsWith('.png')) return 'image/png';
		if (filePath.endsWith('.json')) return 'application/json';
		return 'application/octet-stream';
	}

	private async listAllObjects(prefix: string): Promise<{ Key?: string }[]> {
		const objects: { Key?: string }[] = [];
		let continuationToken: string | undefined;

		do {
			const result = await this.client.send(
				new ListObjectsV2Command({
					Bucket: this.config.bucket,
					Prefix: prefix,
					ContinuationToken: continuationToken,
				}),
			);

			if (result.Contents) {
				objects.push(...result.Contents);
			}

			continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
		} while (continuationToken);

		return objects;
	}

	private async walkDir(dir: string): Promise<string[]> {
		const files: string[] = [];
		const entries = await fs.readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				files.push(...(await this.walkDir(fullPath)));
			} else {
				files.push(fullPath);
			}
		}
		return files;
	}
}
