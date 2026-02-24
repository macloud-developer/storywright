import { defineCommand } from 'citty';
import { loadConfig } from '../../config/index.js';
import { updateBaselines } from '../../core/engine.js';

export const updateCommand = defineCommand({
	meta: {
		name: 'update',
		description: 'Update baseline snapshots',
	},
	args: {
		all: {
			type: 'boolean',
			description: 'Regenerate all baselines',
			default: false,
		},
		upload: {
			type: 'boolean',
			description: 'Upload baselines after update',
			default: false,
		},
	},
	async run({ args }) {
		const config = await loadConfig();
		await updateBaselines(config, { all: args.all, upload: args.upload });
	},
});
