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
