import path from 'node:path';
import { defineCommand } from 'citty';
import { loadConfig } from '../../config/index.js';
import { createStorageAdapter } from '../../storage/index.js';
import { LocalStorageAdapter } from '../../storage/local.js';
import { logger } from '../../utils/logger.js';

export const downloadCommand = defineCommand({
	meta: {
		name: 'download',
		description: 'Download baselines from storage',
	},
	args: {
		branch: {
			type: 'string',
			description: 'Branch to download baselines from',
			default: 'main',
		},
	},
	async run({ args }) {
		const config = await loadConfig();
		const storage = await createStorageAdapter(config.storage);
		const destDir = path.resolve(config.storage.local.baselineDir);
		const branch = args.branch ?? 'main';

		if (storage instanceof LocalStorageAdapter) {
			logger.start(`Extracting baselines from git branch '${branch}'...`);
			try {
				await storage.downloadFromGit(branch, destDir, process.cwd());
				logger.success('Baselines extracted from git');
			} catch (error) {
				logger.error(String(error));
				logger.info(
					'Hint: ensure you are in a git repository with sufficient history (fetch-depth: 0)',
				);
				process.exit(2);
			}
		} else {
			logger.start(`Downloading baselines from ${branch}...`);
			await storage.download({ branch, destDir });
			logger.success('Baselines downloaded');
		}
	},
});
