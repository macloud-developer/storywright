import fs from 'node:fs/promises';
import path from 'node:path';
import picomatch from 'picomatch';
import type { StorywrightConfig } from '../config/types.js';
import { generatePlaywrightConfig } from '../playwright/config-generator.js';
import { generateTestFile } from '../playwright/test-generator.js';
import { resolveAffectedStories } from '../resolver/index.js';
import { createStorageAdapter } from '../storage/index.js';
import { logger } from '../utils/logger.js';
import { resolveOutputDir } from '../utils/path.js';
import { exec } from '../utils/process.js';
import { buildStorybook, discoverStories, filterStories } from './storybook.js';
import type { StoryIndex, TestSummary } from './types.js';

export interface TestOptions {
	diffOnly?: boolean;
	shard?: string;
	updateSnapshots?: boolean;
	filter?: string;
	outputDir?: string;
	reporters?: string[];
}

export interface TestRunResult {
	exitCode: number;
	summary?: TestSummary;
	reportDir?: string;
}

function resolveReporterPath(): string {
	// Resolve relative to this file's dist location
	const thisDir = new URL('.', import.meta.url).pathname;
	return path.resolve(thisDir, 'playwright', 'reporter.js');
}

export async function runTests(
	config: StorywrightConfig,
	options: TestOptions = {},
	cwd: string = process.cwd(),
): Promise<TestRunResult> {
	const outputRoot = options.outputDir
		? path.resolve(cwd, options.outputDir)
		: resolveOutputDir(cwd, '.storywright');
	const tmpDir = path.join(outputRoot, 'tmp');
	const reportDir = options.outputDir
		? path.join(outputRoot, 'report')
		: path.resolve(cwd, config.report.outputDir);
	const storybookDir = path.resolve(cwd, config.storybook.staticDir);

	// 1. Build Storybook if needed
	await buildStorybook(config, cwd);

	// 2. Discover & filter stories
	logger.start('Discovering stories...');
	const allStories = await discoverStories(config, cwd);
	let targetStories = filterStories(allStories, config);

	// Apply --filter option
	if (options.filter) {
		targetStories = applyFilter(targetStories, options.filter);
	}

	logger.info(`${Object.keys(targetStories.entries).length} stories found`);

	// 3. Diff-only: resolve affected stories
	if (options.diffOnly && config.diffDetection.enabled) {
		logger.start('Resolving dependencies...');
		const diffResult = await resolveAffectedStories(
			targetStories,
			config.diffDetection,
			storybookDir,
			cwd,
		);
		if (!diffResult.allStories) {
			targetStories = diffResult.targetStories;
		}
		logger.info(`${Object.keys(targetStories.entries).length} stories affected by changes`);
	}

	// 4. Prepare temp directory
	await fs.mkdir(tmpDir, { recursive: true });

	const targetStoriesPath = path.join(tmpDir, 'target-stories.json');
	await fs.writeFile(targetStoriesPath, JSON.stringify(targetStories));

	// 5. Copy baselines to snapshot dir
	const snapshotDir = path.join(tmpDir, 'snapshots');
	await fs.mkdir(snapshotDir, { recursive: true });

	const storage = createStorageAdapter(config.storage);
	try {
		await storage.download({ branch: 'current', destDir: snapshotDir });
	} catch {
		logger.info('No existing baselines found');
	}

	// 6. Generate Playwright config & test file
	const reporterWrapperPath = path.join(tmpDir, 'reporter.mjs');
	const resolvedReporterPath = resolveReporterPath().replace(/\\/g, '/');
	const reporterOutputDir = reportDir.replace(/\\/g, '/');

	await fs.writeFile(
		reporterWrapperPath,
		`import StorywrightReporter from '${resolvedReporterPath}';\nexport default class extends StorywrightReporter {\n  constructor() { super({ outputDir: '${reporterOutputDir}' }); }\n}\n`,
	);

	const testFileName = 'storywright-test.spec.ts';
	const testFilePath = path.join(tmpDir, testFileName);
	const testContent = generateTestFile(config.screenshot, {
		targetStoriesPath: targetStoriesPath.replace(/\\/g, '/'),
	});
	await fs.writeFile(testFilePath, testContent);

	// Determine Storybook URL
	let actualStorybookUrl = config.storybook.url;
	const needsServer = !actualStorybookUrl;

	if (needsServer) {
		actualStorybookUrl = 'http://localhost:6007';
	}

	const playwrightConfig = generatePlaywrightConfig(config, {
		tmpDir: tmpDir.replace(/\\/g, '/'),
		storybookUrl: actualStorybookUrl ?? 'http://localhost:6007',
		snapshotDir: snapshotDir.replace(/\\/g, '/'),
		reporterPath: reporterWrapperPath.replace(/\\/g, '/'),
		testFile: testFileName,
		shard: options.shard,
		reporters: options.reporters,
	});

	const configPath = path.join(tmpDir, 'playwright.config.ts');
	await fs.writeFile(configPath, playwrightConfig);

	// 7. Run Playwright tests
	logger.start('Running tests...');
	const args = ['playwright', 'test', '--config', configPath];

	if (options.updateSnapshots) {
		args.push('--update-snapshots');
	}

	// Start static server if needed
	let serverProc: { kill: () => void } | undefined;
	if (needsServer) {
		serverProc = await startStaticServer(storybookDir, 6007);
	}

	try {
		const result = await exec('npx', args, { cwd });

		// 8. Read results
		let summary: TestSummary | undefined;
		try {
			const summaryPath = path.join(reportDir, 'summary.json');
			const summaryContent = await fs.readFile(summaryPath, 'utf-8');
			summary = JSON.parse(summaryContent);
		} catch {
			// summary may not exist if no tests ran
		}

		// 9. Map exit codes per SPEC §14.2
		const exitCode = mapExitCode(result.exitCode, summary);

		return { exitCode, summary, reportDir };
	} finally {
		serverProc?.kill();
	}
}

export async function updateBaselines(
	config: StorywrightConfig,
	options: { all?: boolean; upload?: boolean } = {},
	cwd: string = process.cwd(),
): Promise<void> {
	const result = await runTests(config, { updateSnapshots: true, diffOnly: !options.all }, cwd);

	if (result.exitCode !== 0) {
		logger.warn('Some tests failed during baseline update');
	}

	if (options.upload) {
		const storage = createStorageAdapter(config.storage);
		const baselineDir = path.resolve(cwd, config.storage.local.baselineDir);
		await storage.upload({
			branch: 'current',
			sourceDir: baselineDir,
		});
		logger.success('Baselines uploaded');
	}

	logger.success('Baselines updated');
}

function applyFilter(storyIndex: StoryIndex, filter: string): StoryIndex {
	const matcher = picomatch(filter);
	const entries: Record<string, StoryIndex['entries'][string]> = {};
	for (const [id, story] of Object.entries(storyIndex.entries)) {
		const fullName = `${story.title}/${story.name}`;
		if (matcher(fullName) || matcher(story.title) || matcher(story.id)) {
			entries[id] = story;
		}
	}
	return { ...storyIndex, entries };
}

function mapExitCode(playwrightCode: number, summary?: TestSummary): number {
	// SPEC §14.2: 0 = success (no diff), 1 = success (diff found), 2 = execution error, 130 = SIGINT
	if (playwrightCode === 130 || playwrightCode === 143) {
		return 130; // SIGINT / SIGTERM
	}
	if (summary) {
		if (summary.failed > 0) return 1;
		if (summary.total === 0 && playwrightCode !== 0) return 2;
		return 0;
	}
	// No summary = likely execution error
	return playwrightCode === 0 ? 0 : 2;
}

async function startStaticServer(dir: string, port: number): Promise<{ kill: () => void }> {
	const { createServer } = await import('node:http');
	const sirv = (await import('sirv')).default;

	const handler = sirv(dir, { single: false, dev: false });
	const server = createServer(handler);

	await new Promise<void>((resolve, reject) => {
		server.on('error', reject);
		server.listen(port, () => resolve());
	});

	return { kill: () => server.close() };
}
