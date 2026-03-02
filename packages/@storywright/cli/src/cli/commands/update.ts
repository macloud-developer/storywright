import { defineCommand } from 'citty';
import { loadConfig } from '../../config/index.js';
import type { DeepPartial, StorywrightConfig } from '../../config/types.js';
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
		browsers: {
			type: 'string',
			description: 'Browsers to test (comma-separated)',
		},
		shard: {
			type: 'string',
			description: 'Shard specification (index/total)',
		},
		workers: {
			type: 'string',
			description: 'Number of parallel workers',
		},
		filter: {
			type: 'string',
			description: 'Filter stories by glob pattern',
		},
		retries: {
			type: 'string',
			description: 'Number of retries for failed tests',
		},
	},
	async run({ args }) {
		const overrides: DeepPartial<StorywrightConfig> = {};

		if (args.browsers) {
			overrides.browsers = args.browsers.split(',').map((b) => b.trim());
		}
		if (args.workers) {
			overrides.workers = args.workers === 'auto' ? 'auto' : Number(args.workers);
		}
		if (args.retries) {
			overrides.retries = Number(args.retries);
		}

		const config = await loadConfig(process.cwd(), overrides);
		const result = await updateBaselines(config, {
			all: args.all,
			upload: args.upload,
			shard: args.shard,
			filter: args.filter,
		});

		process.exit(result.exitCode);
	},
});
