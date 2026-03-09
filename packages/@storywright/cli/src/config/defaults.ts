import type { StorywrightConfig } from './types.js';

export const DEFAULT_CONFIG: StorywrightConfig = {
	storybook: {
		staticDir: 'storybook-static',
		buildCommand: 'npx storybook build --stats-json',
		url: undefined,
		compatibility: 'auto',
	},

	browsers: ['chromium'],
	browserOptions: {},

	screenshot: {
		fullPage: true,
		animations: 'disabled',
		threshold: 0.02,
		maxDiffPixelRatio: 0.02,
		freezeTime: '2024-01-01T00:00:00',
		timezone: 'UTC',
		locale: 'en-US',
		seed: 1,
	},

	diffDetection: {
		enabled: true,
		watchFiles: ['package.json', 'package-lock.json', '.storybook/**/*'],
		baseBranch: 'main',
		baseBranchDiffDepth: 1,
	},

	storage: {
		provider: 'local',
		local: {
			baselineDir: '.storywright/baselines',
		},
		s3: {
			bucket: '',
			prefix: 'storywright/baselines',
			region: 'ap-northeast-1',
			compression: 'zstd',
		},
	},

	report: {
		outputDir: '.storywright/report',
		title: 'Storywright Report',
	},

	workers: 'auto',
	retries: 0,

	timeout: {
		test: 30000,
		navigation: 20000,
		expect: 10000,
	},

	include: ['**'],
	exclude: [],

	hooks: {},
};
