import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import { gunzip, gzip } from 'node:zlib';
import {
	DeleteObjectsCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { DownloadOptions, StorageAdapter, UploadOptions } from '@storywright/cli';
import * as tar from 'tar';
import { compress as zstdCompress, decompress as zstdDecompress } from 'zstd-napi';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

const ARCHIVE_DIR = '__archives__';

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
		const archivePrefix = `${prefix}${ARCHIVE_DIR}/`;
		const archives = await this.listAllObjects(archivePrefix);

		if (archives.length > 0) {
			await this.downloadArchives(archives, options.destDir);
			return;
		}

		// Fall back to individual files (backward compat)
		await this.downloadIndividualFiles(prefix, options.destDir);
	}

	async upload(options: UploadOptions): Promise<void> {
		const compression = this.config.compression ?? 'none';

		if (compression === 'none') {
			await this.uploadIndividualFiles(options);
			return;
		}

		await this.uploadArchive(options, compression);
	}

	async exists(branch: string): Promise<boolean> {
		const prefix = this.getPrefix(branch);
		try {
			// Check archives
			const archiveResult = await this.client.send(
				new ListObjectsV2Command({
					Bucket: this.config.bucket,
					Prefix: `${prefix}${ARCHIVE_DIR}/`,
					MaxKeys: 1,
				}),
			);
			if ((archiveResult.Contents?.length ?? 0) > 0) return true;

			// Check individual files
			const result = await this.client.send(
				new ListObjectsV2Command({
					Bucket: this.config.bucket,
					Prefix: prefix,
					MaxKeys: 1,
				}),
			);
			return (result.Contents?.length ?? 0) > 0;
		} catch {
			return false;
		}
	}

	// --- Archive upload ---

	private async uploadArchive(options: UploadOptions, compression: 'zstd' | 'gzip'): Promise<void> {
		const prefix = this.getPrefix(options.branch);
		const files = await this.walkDir(options.sourceDir);

		if (files.length === 0) return;

		const relativeFiles = files.map((f) => path.relative(options.sourceDir, f).replace(/\\/g, '/'));

		// Create tar archive in memory
		const pack = tar.create({ cwd: options.sourceDir }, relativeFiles);
		const chunks: Buffer[] = [];
		for await (const chunk of pack) {
			chunks.push(Buffer.from(chunk as Uint8Array));
		}
		const tarBuffer = Buffer.concat(chunks);

		// Compress
		const compressed =
			compression === 'zstd' ? zstdCompress(tarBuffer) : await gzipAsync(tarBuffer);

		// Upload with multipart support for large archives
		const archiveName = this.getArchiveName(options.shard, compression);
		const key = `${prefix}${ARCHIVE_DIR}/${archiveName}`;

		const upload = new Upload({
			client: this.client,
			params: {
				Bucket: this.config.bucket,
				Key: key,
				Body: compressed,
				ContentType: 'application/octet-stream',
				ServerSideEncryption: 'AES256',
			},
		});
		await upload.done();

		// Clean up stale archives (e.g. when shard count or compression changes)
		await this.cleanupStaleArchives(prefix, options.shard, compression);
	}

	// --- Archive download ---

	private async downloadArchives(archives: { Key?: string }[], destDir: string): Promise<void> {
		await fs.mkdir(destDir, { recursive: true });

		for (const archive of archives) {
			if (!archive.Key) continue;

			const getResult = await this.client.send(
				new GetObjectCommand({ Bucket: this.config.bucket, Key: archive.Key }),
			);
			if (!getResult.Body) continue;

			const bytes = await getResult.Body.transformToByteArray();
			const archiveBuffer = Buffer.from(bytes);

			// Detect compression from file extension
			let tarBuffer: Buffer;
			if (archive.Key.endsWith('.tar.zst')) {
				tarBuffer = zstdDecompress(archiveBuffer);
			} else if (archive.Key.endsWith('.tar.gz')) {
				tarBuffer = await gunzipAsync(archiveBuffer);
			} else {
				continue;
			}

			// Extract tar to destination
			await pipeline(
				Readable.from(tarBuffer),
				tar.extract({ cwd: destDir }) as unknown as NodeJS.WritableStream,
			);
		}
	}

	// --- Individual file operations (backward compat) ---

	private async downloadIndividualFiles(prefix: string, destDir: string): Promise<void> {
		const objects = await this.listAllObjects(prefix);
		if (objects.length === 0) return;

		await fs.mkdir(destDir, { recursive: true });

		for (const object of objects) {
			if (!object.Key) continue;

			const relativePath = object.Key.slice(prefix.length);
			if (!relativePath || relativePath.startsWith(`${ARCHIVE_DIR}/`)) continue;

			const destPath = path.join(destDir, relativePath);
			await fs.mkdir(path.dirname(destPath), { recursive: true });

			const getResult = await this.client.send(
				new GetObjectCommand({ Bucket: this.config.bucket, Key: object.Key }),
			);

			if (getResult.Body) {
				const bytes = await getResult.Body.transformToByteArray();
				await fs.writeFile(destPath, Buffer.from(bytes));
			}
		}
	}

	private async uploadIndividualFiles(options: UploadOptions): Promise<void> {
		const prefix = this.getPrefix(options.branch);
		const files = await this.walkDir(options.sourceDir);

		for (const file of files) {
			const relativePath = path.relative(options.sourceDir, file).replace(/\\/g, '/');
			const key = `${prefix}${relativePath}`;
			const content = await fs.readFile(file);

			await this.client.send(
				new PutObjectCommand({
					Bucket: this.config.bucket,
					Key: key,
					Body: content,
					ContentType: this.getContentType(file),
					ServerSideEncryption: 'AES256',
				}),
			);
		}
	}

	// --- Archive management ---

	private getArchiveName(shard: string | undefined, compression: 'zstd' | 'gzip'): string {
		const ext = compression === 'zstd' ? 'tar.zst' : 'tar.gz';
		if (shard) {
			const [index, total] = shard.split('/');
			return `shard-${index}-of-${total}.${ext}`;
		}
		return `baselines.${ext}`;
	}

	private async cleanupStaleArchives(
		prefix: string,
		shard: string | undefined,
		compression: 'zstd' | 'gzip',
	): Promise<void> {
		const archivePrefix = `${prefix}${ARCHIVE_DIR}/`;
		const currentName = this.getArchiveName(shard, compression);
		const allArchives = await this.listAllObjects(archivePrefix);

		const keysToDelete: string[] = [];

		for (const obj of allArchives) {
			if (!obj.Key) continue;
			const name = obj.Key.slice(archivePrefix.length);

			// Never delete the just-uploaded archive
			if (name === currentName) continue;

			if (shard) {
				const [, total] = shard.split('/');

				// Delete archives with a different shard total
				const shardMatch = name.match(/^shard-\d+-of-(\d+)\./);
				if (shardMatch && shardMatch[1] !== total) {
					keysToDelete.push(obj.Key);
					continue;
				}

				// Delete same shard index with different compression
				// e.g. uploading shard-1-of-3.tar.zst → delete shard-1-of-3.tar.gz
				const currentBase = currentName.replace(/\.tar\.(zst|gz)$/, '');
				if (name.startsWith(`${currentBase}.`)) {
					keysToDelete.push(obj.Key);
					continue;
				}

				// Delete non-shard baselines (switching from non-shard to shard)
				if (name.startsWith('baselines.')) {
					keysToDelete.push(obj.Key);
				}
			} else {
				// Non-shard mode: delete all shard archives and other baseline formats
				if (name.startsWith('shard-') || name.startsWith('baselines.')) {
					keysToDelete.push(obj.Key);
				}
			}
		}

		await this.deleteObjects(keysToDelete);
	}

	private async deleteObjects(keys: string[]): Promise<void> {
		if (keys.length === 0) return;

		// DeleteObjects supports up to 1000 keys per call
		for (let i = 0; i < keys.length; i += 1000) {
			const batch = keys.slice(i, i + 1000);
			await this.client.send(
				new DeleteObjectsCommand({
					Bucket: this.config.bucket,
					Delete: {
						Objects: batch.map((Key) => ({ Key })),
						Quiet: true,
					},
				}),
			);
		}
	}

	// --- Utilities ---

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
