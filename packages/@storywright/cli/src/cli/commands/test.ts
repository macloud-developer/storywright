import { defineCommand } from 'citty';
import { loadConfig } from '../../config/index.js';
import type { DeepPartial, StorywrightConfig } from '../../config/types.js';
import { runTests } from '../../core/engine.js';
import { formatSummary } from '../../reporter/cli-reporter.js';

export const testCommand = defineCommand({
	meta: {
		name: 'test',
		description: 'Run visual regression tests',
	},
	args: {
		browsers: {
			type: 'string',
			description: 'Browsers to test (comma-separated)',
		},
		shard: {
			type: 'string',
			description: 'Shard specification (index/total)',
		},
		'diff-only': {
			type: 'boolean',
			description: 'Only test stories affected by git changes',
			default: false,
		},
		threshold: {
			type: 'string',
			description: 'Pixel color threshold (0-1)',
		},
		'max-diff-pixel-ratio': {
			type: 'string',
			description: 'Maximum diff pixel ratio (0-1)',
		},
		'storybook-url': {
			type: 'string',
			description: 'URL of running Storybook',
		},
		'storybook-dir': {
			type: 'string',
			description: 'Storybook build directory',
		},
		'update-snapshots': {
			type: 'boolean',
			description: 'Update baseline snapshots',
			default: false,
		},
		'full-page': {
			type: 'boolean',
			description: 'Take full page screenshots',
		},
		workers: {
			type: 'string',
			description: 'Number of parallel workers',
		},
		retries: {
			type: 'string',
			description: 'Number of retries for failed tests',
		},
		filter: {
			type: 'string',
			description: 'Filter stories by glob pattern',
		},
		'output-dir': {
			type: 'string',
			description: 'Output root directory (.storywright by default)',
		},
		reporters: {
			type: 'string',
			description: 'Reporters (comma-separated, e.g. default,html)',
		},
	},
	async run({ args }) {
		const overrides: DeepPartial<StorywrightConfig> = {};

		if (args.browsers) {
			overrides.browsers = args.browsers.split(',').map((b) => b.trim());
		}
		if (args.threshold) {
			overrides.screenshot = { ...overrides.screenshot, threshold: Number(args.threshold) };
		}
		if (args['max-diff-pixel-ratio']) {
			overrides.screenshot = {
				...overrides.screenshot,
				maxDiffPixelRatio: Number(args['max-diff-pixel-ratio']),
			};
		}
		if (args['storybook-url']) {
			overrides.storybook = { ...overrides.storybook, url: args['storybook-url'] };
		}
		if (args['storybook-dir']) {
			overrides.storybook = { ...overrides.storybook, staticDir: args['storybook-dir'] };
		}
		if (args['full-page'] !== undefined) {
			overrides.screenshot = { ...overrides.screenshot, fullPage: args['full-page'] };
		}
		if (args.workers) {
			overrides.workers = args.workers === 'auto' ? 'auto' : Number(args.workers);
		}
		if (args.retries) {
			overrides.retries = Number(args.retries);
		}

		const config = await loadConfig(process.cwd(), overrides);
		const result = await runTests(
			config,
			{
				diffOnly: args['diff-only'],
				shard: args.shard,
				updateSnapshots: args['update-snapshots'],
				filter: args.filter,
				outputDir: args['output-dir'],
				reporters: args.reporters?.split(',').map((r) => r.trim()),
			},
			process.cwd(),
		);

		if (result.summary) {
			const reportPath = result.reportDir ? `${result.reportDir}/index.html` : undefined;
			console.log(formatSummary(result.summary, { reportPath }));
		}

		process.exit(result.exitCode);
	},
});
