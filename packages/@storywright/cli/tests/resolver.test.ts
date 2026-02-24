import { describe, expect, it } from 'vitest';
import type { StatsIndex, StoryIndex } from '../src/core/types.js';
import { StorybookStatsDependencyResolver } from '../src/resolver/index.js';

const stubStats: StatsIndex = {
	modules: [
		{
			id: './src/Button.tsx',
			name: './src/Button.tsx',
			reasons: [{ moduleName: './src/Button.stories.ts' }],
		},
		{
			id: './src/Form.tsx',
			name: './src/Form.tsx',
			reasons: [{ moduleName: './src/Button.tsx' }],
		},
		{
			id: './src/Form.stories.ts',
			name: './src/Form.stories.ts',
			reasons: [],
		},
		{
			id: './src/Button.stories.ts',
			name: './src/Button.stories.ts',
			reasons: [],
		},
	],
};

const stubStories: StoryIndex = {
	v: 5,
	entries: {
		'button--primary': {
			id: 'button--primary',
			title: 'Components/Button',
			name: 'Primary',
			importPath: './src/Button.stories.ts',
			type: 'story',
			tags: [],
		},
		'form--default': {
			id: 'form--default',
			title: 'Components/Form',
			name: 'Default',
			importPath: './src/Form.stories.ts',
			type: 'story',
			tags: [],
		},
	},
};

describe('StorybookStatsDependencyResolver', () => {
	it('should resolve direct dependencies', () => {
		const resolver = new StorybookStatsDependencyResolver(stubStats, stubStories);
		const deps = resolver.getDependencies('./src/Button.tsx');
		expect(deps).toContain('./src/Button.stories.ts');
		expect(deps).toContain('./src/Button.tsx');
	});

	it('should resolve indirect dependencies (Form depends on Button)', () => {
		const resolver = new StorybookStatsDependencyResolver(stubStats, stubStories);
		const deps = resolver.getDependencies('./src/Form.tsx');
		expect(deps).toContain('./src/Button.tsx');
	});

	it('should get stories for affected files', () => {
		const resolver = new StorybookStatsDependencyResolver(stubStats, stubStories);
		const stories = resolver.getStoriesForFiles(['./src/Button.tsx']);
		expect(Object.keys(stories.entries)).toContain('button--primary');
	});

	it('should collect all stories when a component is referenced by multiple story files', () => {
		const multiStoryStats: StatsIndex = {
			modules: [
				{
					id: './src/Button.tsx',
					name: './src/Button.tsx',
					reasons: [
						{ moduleName: './src/Button.stories.ts' },
						{ moduleName: './src/ButtonCompact.stories.ts' },
					],
				},
				{
					id: './src/Button.stories.ts',
					name: './src/Button.stories.ts',
					reasons: [],
				},
				{
					id: './src/ButtonCompact.stories.ts',
					name: './src/ButtonCompact.stories.ts',
					reasons: [],
				},
			],
		};
		const multiStoryIndex: StoryIndex = {
			v: 5,
			entries: {
				'button--primary': {
					id: 'button--primary',
					title: 'Components/Button',
					name: 'Primary',
					importPath: './src/Button.stories.ts',
					type: 'story',
					tags: [],
				},
				'button-compact--default': {
					id: 'button-compact--default',
					title: 'Components/ButtonCompact',
					name: 'Default',
					importPath: './src/ButtonCompact.stories.ts',
					type: 'story',
					tags: [],
				},
			},
		};
		const resolver = new StorybookStatsDependencyResolver(multiStoryStats, multiStoryIndex);
		const stories = resolver.getStoriesForFiles(['./src/Button.tsx']);
		expect(Object.keys(stories.entries)).toContain('button--primary');
		expect(Object.keys(stories.entries)).toContain('button-compact--default');
	});

	it('should resolve module when id differs from name', () => {
		const idDiffStats: StatsIndex = {
			modules: [
				{
					id: '12345',
					name: './src/Card.tsx',
					reasons: [{ moduleName: './src/Card.stories.ts' }],
				},
				{
					id: '12346',
					name: './src/Card.stories.ts',
					reasons: [],
				},
			],
		};
		const cardStories: StoryIndex = {
			v: 5,
			entries: {
				'card--default': {
					id: 'card--default',
					title: 'Components/Card',
					name: 'Default',
					importPath: './src/Card.stories.ts',
					type: 'story',
					tags: [],
				},
			},
		};
		const resolver = new StorybookStatsDependencyResolver(idDiffStats, cardStories);
		// Lookup by name (normalized) should work
		const stories = resolver.getStoriesForFiles(['./src/Card.tsx']);
		expect(Object.keys(stories.entries)).toContain('card--default');
	});

	it('should resolve module regardless of leading ./ in paths', () => {
		// Stats uses paths without ./
		const noDotSlashStats: StatsIndex = {
			modules: [
				{
					id: 'src/Input.tsx',
					name: 'src/Input.tsx',
					reasons: [{ moduleName: 'src/Input.stories.ts' }],
				},
				{
					id: 'src/Input.stories.ts',
					name: 'src/Input.stories.ts',
					reasons: [],
				},
			],
		};
		const inputStories: StoryIndex = {
			v: 5,
			entries: {
				'input--default': {
					id: 'input--default',
					title: 'Components/Input',
					name: 'Default',
					importPath: './src/Input.stories.ts',
					type: 'story',
					tags: [],
				},
			},
		};
		const resolver = new StorybookStatsDependencyResolver(noDotSlashStats, inputStories);
		// Query with ./ prefix against stats without ./
		const stories = resolver.getStoriesForFiles(['./src/Input.tsx']);
		expect(Object.keys(stories.entries)).toContain('input--default');

		// Query without ./ prefix should also work
		const stories2 = resolver.getStoriesForFiles(['src/Input.tsx']);
		expect(Object.keys(stories2.entries)).toContain('input--default');
	});

	it('should handle circular dependencies without infinite loop', () => {
		const circularStats: StatsIndex = {
			modules: [
				{
					id: './src/A.tsx',
					name: './src/A.tsx',
					reasons: [{ moduleName: './src/B.tsx' }],
				},
				{
					id: './src/B.tsx',
					name: './src/B.tsx',
					reasons: [{ moduleName: './src/A.tsx' }],
				},
			],
		};
		const resolver = new StorybookStatsDependencyResolver(circularStats, stubStories);
		const deps = resolver.getDependencies('./src/A.tsx');
		expect(deps).toContain('./src/B.tsx');
		expect(deps).toContain('./src/A.tsx');
	});
});
