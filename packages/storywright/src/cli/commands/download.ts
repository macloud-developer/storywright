import path from 'node:path';
import { defineCommand } from 'citty';
import { loadConfig } from '../../config/index.js';
import { createStorageAdapter } from '../../storage/index.js';
import { logger } from '../../utils/logger.js';

export const downloadCommand = defineCommand({
	meta: {
		name: 'download',
		description: 'Download baselines from remote storage',
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
		const storage = createStorageAdapter(config.storage);
		const destDir = path.resolve(config.storage.local.baselineDir);

		logger.start(`Downloading baselines from ${args.branch}...`);
		await storage.download({
			branch: args.branch ?? 'main',
			destDir,
		});
		logger.success('Baselines downloaded');
	},
});
