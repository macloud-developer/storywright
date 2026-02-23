import path from 'node:path';
import { loadConfig } from '../config/index.js';
import type { DeepPartial, StorywrightConfig } from '../config/types.js';
import { formatSummary } from '../reporter/cli-reporter.js';
import { createStorageAdapter } from '../storage/index.js';
import { type TestRunResult, runTests, updateBaselines } from './engine.js';

export interface Storywright {
	test(options?: {
		diffOnly?: boolean;
		browsers?: string[];
		shard?: string;
		filter?: string;
	}): Promise<TestRunResult>;

	update(options?: { all?: boolean }): Promise<void>;
	upload(): Promise<void>;
	download(options?: { branch?: string }): Promise<void>;
	generateReport(result: TestRunResult): string | undefined;
}

export async function createStorywright(
	userConfig?: DeepPartial<StorywrightConfig>,
	cwd: string = process.cwd(),
): Promise<Storywright> {
	const config = await loadConfig(cwd, userConfig);

	return {
		async test(options = {}) {
			const overrides: DeepPartial<StorywrightConfig> = {};
			if (options.browsers) {
				overrides.browsers = options.browsers;
			}
			const mergedConfig = options.browsers
				? await loadConfig(cwd, { ...userConfig, ...overrides })
				: config;

			return runTests(
				mergedConfig,
				{
					diffOnly: options.diffOnly,
					shard: options.shard,
					filter: options.filter,
				},
				cwd,
			);
		},

		async update(options = {}) {
			await updateBaselines(config, { all: options.all }, cwd);
		},

		async upload() {
			const storage = createStorageAdapter(config.storage);
			await storage.upload({
				branch: 'current',
				sourceDir: path.resolve(cwd, config.storage.local.baselineDir),
			});
		},

		async download(options = {}) {
			const storage = createStorageAdapter(config.storage);
			await storage.download({
				branch: options.branch ?? 'main',
				destDir: path.resolve(cwd, config.storage.local.baselineDir),
			});
		},

		generateReport(result: TestRunResult): string | undefined {
			if (result.summary) {
				const reportPath = result.reportDir ? `${result.reportDir}/index.html` : undefined;
				return formatSummary(result.summary, { reportPath });
			}
			return undefined;
		},
	};
}
