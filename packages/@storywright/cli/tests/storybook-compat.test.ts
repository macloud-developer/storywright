import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import type { StorywrightConfig } from '../src/config/types.js';
import { discoverStories } from '../src/core/storybook.js';

let tmpDir: string;

function makeConfig(overrides: Partial<StorywrightConfig['storybook']> = {}): StorywrightConfig {
	return {
		...DEFAULT_CONFIG,
		storybook: {
			...DEFAULT_CONFIG.storybook,
			staticDir: path.join(tmpDir, 'storybook-static'),
			...overrides,
		},
	};
}

async function writeIndex(data: Record<string, unknown>): Promise<void> {
	const dir = path.join(tmpDir, 'storybook-static');
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'index.json'), JSON.stringify(data));
}

beforeEach(async () => {
	tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sw-test-'));
});

afterEach(async () => {
	await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('Storybook version compatibility', () => {
	it('should parse Storybook 8 index.json (v4)', async () => {
		await writeIndex({
			v: 4,
			entries: {
				'button--primary': {
					id: 'button--primary',
					title: 'Button',
					name: 'Primary',
					importPath: './src/Button.stories.ts',
					type: 'story',
					tags: [],
				},
			},
		});
		const result = await discoverStories(makeConfig(), tmpDir);
		expect(result.v).toBe(4);
		expect(result.entries['button--primary']).toBeDefined();
	});

	it('should parse Storybook 9/10 index.json (v5)', async () => {
		await writeIndex({
			v: 5,
			entries: {
				'card--default': {
					id: 'card--default',
					title: 'Card',
					name: 'Default',
					importPath: './src/Card.stories.ts',
					type: 'story',
					tags: [],
				},
			},
		});
		const result = await discoverStories(makeConfig(), tmpDir);
		expect(result.v).toBe(5);
		expect(result.entries['card--default']).toBeDefined();
	});

	it('should reject Storybook 7 index.json (v3 with stories key)', async () => {
		await writeIndex({
			v: 3,
			stories: {
				'button--primary': {
					id: 'button--primary',
					title: 'Button',
					name: 'Primary',
					importPath: './src/Button.stories.ts',
				},
			},
		});
		await expect(discoverStories(makeConfig(), tmpDir)).rejects.toThrow(
			'SW_E_STORYBOOK_UNSUPPORTED',
		);
	});

	it('should reject index.json without version field', async () => {
		await writeIndex({
			entries: {
				'button--primary': {
					id: 'button--primary',
					title: 'Button',
					name: 'Primary',
					importPath: './src/Button.stories.ts',
					type: 'story',
				},
			},
		});
		await expect(discoverStories(makeConfig(), tmpDir)).rejects.toThrow(
			'SW_E_STORYBOOK_UNSUPPORTED',
		);
	});
});
