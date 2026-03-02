import type { StorageConfig } from '../config/types.js';
import { LocalStorageAdapter } from './local.js';
import type { StorageAdapter } from './types.js';

export async function createStorageAdapter(config: StorageConfig): Promise<StorageAdapter> {
	switch (config.provider) {
		case 'local':
			return new LocalStorageAdapter(config.local.baselineDir);
		case 's3':
			return await loadS3Adapter(config);
		default:
			throw new Error(`Unknown storage provider: ${config.provider}`);
	}
}

async function loadS3Adapter(config: StorageConfig): Promise<StorageAdapter> {
	try {
		const { S3StorageAdapter } = await import('@storywright/storage-s3');
		return new S3StorageAdapter(config.s3);
	} catch {
		throw new Error(
			'S3 storage adapter requires the @storywright/storage-s3 package.\nInstall it with: pnpm add @storywright/storage-s3',
		);
	}
}

export type { StorageAdapter, DownloadOptions, UploadOptions } from './types.js';
