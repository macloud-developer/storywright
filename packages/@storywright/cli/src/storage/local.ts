import fs from 'node:fs/promises';
import path from 'node:path';
import type { DownloadOptions, StorageAdapter, UploadOptions } from './types.js';

export class LocalStorageAdapter implements StorageAdapter {
	constructor(private readonly baselineDir: string) {}

	async download(options: DownloadOptions): Promise<void> {
		const sourceDir = path.resolve(this.baselineDir, options.branch);
		try {
			await fs.access(sourceDir);
		} catch {
			return;
		}
		await fs.cp(sourceDir, options.destDir, { recursive: true });
	}

	async upload(options: UploadOptions): Promise<void> {
		const destDir = path.resolve(this.baselineDir, options.branch);
		await fs.mkdir(destDir, { recursive: true });
		await fs.cp(options.sourceDir, destDir, { recursive: true });
	}

	async exists(branch: string): Promise<boolean> {
		const dir = path.resolve(this.baselineDir, branch);
		try {
			await fs.access(dir);
			return true;
		} catch {
			return false;
		}
	}
}
