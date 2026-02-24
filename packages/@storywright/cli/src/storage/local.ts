import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type { DownloadOptions, StorageAdapter, UploadOptions } from './types.js';

const execFileAsync = promisify(execFile);

export class LocalStorageAdapter implements StorageAdapter {
	constructor(private readonly baselineDir: string) {}

	async download(options: DownloadOptions): Promise<void> {
		try {
			await fs.access(this.baselineDir);
		} catch {
			return;
		}
		await fs.cp(this.baselineDir, options.destDir, { recursive: true });
	}

	async upload(options: UploadOptions): Promise<void> {
		const resolvedSource = path.resolve(options.sourceDir);
		const resolvedDest = path.resolve(this.baselineDir);
		if (resolvedSource === resolvedDest) {
			return;
		}
		await fs.mkdir(this.baselineDir, { recursive: true });
		await fs.cp(options.sourceDir, this.baselineDir, { recursive: true });
	}

	async exists(_branch: string): Promise<boolean> {
		try {
			await fs.access(this.baselineDir);
			const entries = await fs.readdir(this.baselineDir);
			return entries.length > 0;
		} catch {
			return false;
		}
	}

	/**
	 * Extract baselines from a git branch using `git ls-tree` + `git show`.
	 * Binary-safe (PNG files) via `encoding: 'buffer'`.
	 */
	async downloadFromGit(
		branch: string,
		destDir: string,
		cwd: string,
	): Promise<void> {
		const gitPath = this.baselineDir.split(path.sep).join('/');

		let lsOutput: string;
		try {
			const result = await execFileAsync(
				'git',
				['ls-tree', '-r', '--name-only', branch, '--', gitPath],
				{ cwd },
			);
			lsOutput = result.stdout;
		} catch (error) {
			throw new Error(
				`Failed to list baselines from git branch '${branch}': ${error instanceof Error ? error.message : error}`,
			);
		}

		const files = lsOutput.trim().split('\n').filter(Boolean);
		if (files.length === 0) {
			return;
		}

		await fs.mkdir(destDir, { recursive: true });

		const posixBaselineDir = this.baselineDir
			.split(path.sep)
			.join('/')
			.replace(/\/+$/, '');

		for (const file of files) {
			let content: Buffer;
			try {
				const result = await execFileAsync(
					'git',
					['show', `${branch}:${file}`],
					{
						cwd,
						encoding: 'buffer' as unknown as BufferEncoding,
						maxBuffer: 50 * 1024 * 1024,
					},
				);
				content = result.stdout as unknown as Buffer;
			} catch (error) {
				throw new Error(
					`Failed to extract '${file}' from git branch '${branch}': ${error instanceof Error ? error.message : error}`,
				);
			}

			const relativePath = file.slice(posixBaselineDir.length + 1);
			const destPath = path.join(destDir, ...relativePath.split('/'));
			await fs.mkdir(path.dirname(destPath), { recursive: true });
			await fs.writeFile(destPath, content);
		}
	}
}
