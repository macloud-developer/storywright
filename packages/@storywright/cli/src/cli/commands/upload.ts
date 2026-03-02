import path from 'node:path';
import { defineCommand } from 'citty';
import { loadConfig } from '../../config/index.js';
import { createStorageAdapter } from '../../storage/index.js';
import { logger } from '../../utils/logger.js';

export const uploadCommand = defineCommand({
	meta: {
		name: 'upload',
		description: 'Upload baselines to remote storage',
	},
	args: {},
	async run() {
		const config = await loadConfig();
		const storage = await createStorageAdapter(config.storage);
		const snapshotDir = path.resolve(config.storage.local.baselineDir);

		logger.start('Uploading baselines...');
		await storage.upload({
			branch: 'current',
			sourceDir: snapshotDir,
		});
		logger.success('Baselines uploaded');
	},
});
