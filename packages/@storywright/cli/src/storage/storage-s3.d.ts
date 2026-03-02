declare module '@storywright/storage-s3' {
	import type { S3StorageConfig } from '../config/types.js';

	export class S3StorageAdapter {
		constructor(config: S3StorageConfig);
	}
}
