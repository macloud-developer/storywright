import fs from 'node:fs/promises';
import path from 'node:path';
import picomatch from 'picomatch';
import type { StorywrightConfig } from '../config/types.js';
import { logger } from '../utils/logger.js';
import { exec } from '../utils/process.js';
import type { Story, StoryIndex } from './types.js';

export async function buildStorybook(config: StorywrightConfig, cwd: string): Promise<void> {
	if (config.storybook.url) {
		logger.info('Using running Storybook at', config.storybook.url);
		return;
	}

	const staticDir = path.resolve(cwd, config.storybook.staticDir);
	try {
		await fs.access(path.join(staticDir, 'index.json'));
		logger.info('Storybook already built at', staticDir);
		return;
	} catch {
		// need to build
	}

	logger.start('Building Storybook...');
	const [command, ...args] = config.storybook.buildCommand.split(' ');
	const result = await exec(command, args, { cwd });
	if (result.exitCode !== 0) {
		throw new Error(
			`Storybook build failed (exit code ${result.exitCode}):\n${result.stderr}\n\nError code: SW_E_STORYBOOK_BUILD_FAILED`,
		);
	}
	logger.success('Storybook built');
}

export async function discoverStories(config: StorywrightConfig, cwd: string): Promise<StoryIndex> {
	const staticDir = path.resolve(cwd, config.storybook.staticDir);
	const indexPath = path.join(staticDir, 'index.json');

	try {
		await fs.access(indexPath);
	} catch {
		throw new Error(
			`Storybook build directory not found at '${config.storybook.staticDir}/'\n\n  Run one of the following:\n    $ npx storybook build --stats-json\n    $ npx storywright test --storybook-url http://localhost:6006\n\n  Error code: SW_E_STORYBOOK_DIR_NOT_FOUND`,
		);
	}

	const raw = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
	const indexJson = normalizeStoryIndex(raw, config.storybook.compatibility);

	// Version check
	if (indexJson.v < 4) {
		throw new Error(
			'Storybook 7.x or earlier is not supported. Storywright requires Storybook 8 or later.\n\nError code: SW_E_STORYBOOK_UNSUPPORTED',
		);
	}

	return indexJson;
}

/**
 * Parse Storybook index.json (v8+).
 */
function normalizeStoryIndex(
	raw: Record<string, unknown>,
	_compatibility: 'auto' | 'v8',
): StoryIndex {
	const version = typeof raw.v === 'number' ? raw.v : 0;
	const entries = (raw.entries ?? {}) as Record<string, Story>;

	return { v: version, entries };
}

export function filterStories(storyIndex: StoryIndex, config: StorywrightConfig): StoryIndex {
	const entries: Record<string, Story> = {};
	const includeMatchers = config.include.map((p) => picomatch(p));
	const excludeMatchers = config.exclude.map((p) => picomatch(p));

	for (const [id, story] of Object.entries(storyIndex.entries)) {
		// Skip docs entries
		if (story.type === 'docs') continue;
		if (story.name === 'Docs') continue;

		const fullName = `${story.title}/${story.name}`;

		// Check include patterns
		const isIncluded = includeMatchers.some((m) => m(fullName));
		if (!isIncluded) continue;

		// Check exclude patterns
		const isExcluded = excludeMatchers.some((m) => m(fullName));
		if (isExcluded) continue;

		entries[id] = story;
	}

	return { ...storyIndex, entries };
}
