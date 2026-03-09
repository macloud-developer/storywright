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
		this.moduleMap = {};
		for (const mod of statsJson.modules) {
			// Key by normalized name (primary) and normalized id (fallback)
			const normalizedName = normalizePath(mod.name);
			this.moduleMap[normalizedName] = mod;
			const normalizedId = normalizePath(mod.id);
			if (normalizedId !== normalizedName) {
				this.moduleMap[normalizedId] ??= mod;
			}
		}
	}

	getDependencies(filePath: string): string[] {
		const normalizedPath = normalizePath(filePath);
		const dependencies = this.collectDependencies(normalizedPath);

		if (this.moduleMap[normalizedPath]) {
			dependencies.add(normalizedPath);
		}

		return [...dependencies];
	}

	getStoriesForFiles(pathList: string[]): StoryIndex {
		const result: StoryIndex = { v: this.storiesJson.v, entries: {} };

		for (const filePath of pathList) {
			// Finding #2 + #3: lookup via normalized moduleMap (name primary, id fallback)
			const normalizedPath = normalizePath(filePath);
			const stats = this.moduleMap[normalizedPath];
			if (!stats) continue;

			// Finding #1: collect ALL story reasons, not just first
			const storyReasons = stats.reasons.filter((r) => isStoryFile(r.moduleName));
			for (const reason of storyReasons) {
				const normalizedImportPath = normalizePath(reason.moduleName);
				// Collect ALL matching story entries per reason
				for (const storyObj of Object.values(this.storiesJson.entries)) {
					if (storyObj.type !== 'story') continue;
					if (normalizePath(storyObj.importPath) === normalizedImportPath) {
						result.entries[storyObj.id] = storyObj;
					}
				}
			}
		}

		return result;
	}

	private collectDependencies(name: string, result = new Set<string>()): Set<string> {
		const mod = this.moduleMap[normalizePath(name)];
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
		// Detect if HEAD is on the base branch (e.g. main)
		const currentBranch = (await git.raw(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
		const isOnBaseBranch = currentBranch === config.baseBranch;

		let diffBase: string;
		if (isOnBaseBranch && config.baseBranchDiffDepth > 0) {
			// On the base branch, merge-base == HEAD so diff would be empty.
			// Use HEAD~N to compare against the previous commit(s) instead.
			diffBase = `HEAD~${config.baseBranchDiffDepth}`;
			logger.info(`On base branch '${config.baseBranch}', using ${diffBase} for diff detection`);
		} else {
			const mergeBase = await git.raw(['merge-base', config.baseBranch, 'HEAD']);
			diffBase = mergeBase.trim();
		}

		const diff = await git.diffSummary([diffBase, 'HEAD']);
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
