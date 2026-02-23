import fs from 'node:fs/promises';
import path from 'node:path';
import picomatch from 'picomatch';
import { simpleGit } from 'simple-git';
import type { DiffDetectionConfig } from '../config/types.js';
import type { StatsIndex, StatsModule, StoryIndex } from '../core/types.js';
import { logger } from '../utils/logger.js';
import { normalizePath, stripLeadingDotSlash } from '../utils/path.js';

export interface DependencyResolver {
	getDependencies(filePath: string): string[];
	getStoriesForFiles(pathList: string[]): StoryIndex;
}

const STORY_FILE_PATTERNS = ['.stories.', '.mdx'];

function isStoryFile(moduleName: string): boolean {
	return STORY_FILE_PATTERNS.some((p) => moduleName.includes(p));
}

export class StorybookStatsDependencyResolver implements DependencyResolver {
	private moduleMap: Record<string, StatsModule>;

	constructor(
		private statsJson: StatsIndex,
		private storiesJson: StoryIndex,
	) {
		this.moduleMap = statsJson.modules.reduce(
			(map, mod) => {
				map[mod.name] = mod;
				return map;
			},
			{} as Record<string, StatsModule>,
		);
	}

	getDependencies(filePath: string): string[] {
		const normalizedPath = normalizePath(filePath);
		const dependencies = this.collectDependencies(normalizedPath);

		if (this.moduleMap[normalizedPath]) {
			dependencies.add(normalizedPath);
		}

		return Array.from(dependencies);
	}

	getStoriesForFiles(pathList: string[]): StoryIndex {
		const result: StoryIndex = { v: this.storiesJson.v, entries: {} };

		for (const filePath of pathList) {
			const stats = this.statsJson.modules.find((m) => m.id === filePath);
			if (!stats) continue;

			// Check both .stories.* and .mdx files
			const storyReason = stats.reasons.find((r) => isStoryFile(r.moduleName));
			if (!storyReason) continue;

			const storyObj = Object.values(this.storiesJson.entries).find(
				(s) => s.importPath === storyReason.moduleName,
			);
			if (storyObj && storyObj.type === 'story') {
				result.entries[storyObj.id] = storyObj;
			}
		}

		return result;
	}

	private collectDependencies(name: string, result = new Set<string>()): Set<string> {
		const mod = this.moduleMap[name];
		if (mod) {
			for (const reason of mod.reasons) {
				if (!result.has(reason.moduleName)) {
					result.add(reason.moduleName);
					this.collectDependencies(reason.moduleName, result);
				}
			}
		}
		return result;
	}
}

export interface DiffResult {
	allStories: boolean;
	targetStories: StoryIndex;
}

interface DiffFileEntry {
	file: string;
	from?: string;
}

export async function resolveAffectedStories(
	storiesJson: StoryIndex,
	config: DiffDetectionConfig,
	storybookStaticDir: string,
	cwd: string,
): Promise<DiffResult> {
	const git = simpleGit({ baseDir: cwd });

	// Get diff summary
	let diffEntries: DiffFileEntry[];
	try {
		const mergeBase = await git.raw(['merge-base', config.baseBranch, 'HEAD']);
		const diff = await git.diffSummary([mergeBase.trim(), 'HEAD']);
		diffEntries = diff.files.map((f) => ({
			file: f.file,
			// Handle renames: include both old and new paths
			from: 'from' in f ? (f as { from: string }).from : undefined,
		}));
	} catch {
		logger.warn('Failed to resolve git diff, running all stories');
		return { allStories: true, targetStories: storiesJson };
	}

	if (diffEntries.length === 0) {
		logger.info('No changed files detected');
		return { allStories: false, targetStories: { v: storiesJson.v, entries: {} } };
	}

	// Collect all affected paths (including rename sources)
	const allPaths: string[] = [];
	for (const entry of diffEntries) {
		allPaths.push(entry.file);
		if (entry.from) {
			allPaths.push(entry.from);
		}
	}

	// Check watchFiles
	for (const file of allPaths) {
		for (const pattern of config.watchFiles) {
			if (picomatch(pattern)(file)) {
				logger.info(`Watch file changed: ${file}, running all stories`);
				return { allStories: true, targetStories: storiesJson };
			}
		}
	}

	// Load stats json for dependency resolution
	const statsPath = path.resolve(storybookStaticDir, 'preview-stats.json');
	let statsJson: StatsIndex;
	try {
		statsJson = JSON.parse(await fs.readFile(statsPath, 'utf-8'));
	} catch {
		logger.warn('preview-stats.json not found, running all stories');
		return { allStories: true, targetStories: storiesJson };
	}

	const resolver = new StorybookStatsDependencyResolver(statsJson, storiesJson);
	const targetStories: StoryIndex = { v: storiesJson.v, entries: {} };

	// Direct story file matches (both .stories.* and .mdx)
	for (const file of allPaths) {
		const matchedStories = Object.values(storiesJson.entries).filter(
			(story) => stripLeadingDotSlash(story.importPath) === file,
		);
		for (const story of matchedStories) {
			targetStories.entries[story.id] = story;
		}
	}

	// Dependency-based matches
	for (const file of allPaths) {
		const deps = resolver.getDependencies(normalizePath(file));
		const depStories = resolver.getStoriesForFiles(deps);
		for (const [id, story] of Object.entries(depStories.entries)) {
			targetStories.entries[id] = story;
		}
	}

	logger.info(`Resolved ${Object.keys(targetStories.entries).length} affected stories`);
	return { allStories: false, targetStories };
}
