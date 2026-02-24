import { createRequire } from 'node:module';
import type { StorageConfig } from '../config/types.js';
import { LocalStorageAdapter } from './local.js';
import type { StorageAdapter } from './types.js';

export function createStorageAdapter(config: StorageConfig): StorageAdapter {
	switch (config.provider) {
		case 'local':
			return new LocalStorageAdapter(config.local.baselineDir);
		case 's3':
			return loadS3Adapter(config);
		default:
			throw new Error(`Unknown storage provider: ${config.provider}`);
	}
}

function loadS3Adapter(config: StorageConfig): StorageAdapter {
	try {
		const require = createRequire(import.meta.url);
		const { S3StorageAdapter } = require('@storywright/storage-s3') as {
			S3StorageAdapter: new (cfg: {
				bucket: string;
				prefix: string;
				region: string;
				compression?: string;
			}) => StorageAdapter;
		};
		return new S3StorageAdapter(config.s3);
	} catch {
		throw new Error(
			'S3 storage adapter requires the @storywright/storage-s3 package.\nInstall it with: pnpm add @storywright/storage-s3',
		);
	}
}

export type { StorageAdapter, DownloadOptions, UploadOptions } from './types.js';
