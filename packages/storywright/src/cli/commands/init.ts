import fs from 'node:fs/promises';
import path from 'node:path';
import { defineCommand } from 'citty';
import { logger } from '../../utils/logger.js';

const CONFIG_TEMPLATE = `import { defineConfig } from '@storywright/cli';

export default defineConfig({
\t// Storybook settings
\tstorybook: {
\t\tstaticDir: 'storybook-static',
\t},

\t// Browsers to test
\tbrowsers: ['chromium'],

\t// Screenshot settings
\tscreenshot: {
\t\tfullPage: true,
\t\tanimations: 'disabled',
\t\tthreshold: 0.02,
\t\tmaxDiffPixelRatio: 0.02,
\t},

\t// Storage settings
\tstorage: {
\t\tprovider: 'local',
\t},
});
`;

export const initCommand = defineCommand({
	meta: {
		name: 'init',
		description: 'Initialize storywright configuration',
	},
	args: {},
	async run() {
		const configPath = path.resolve('storywright.config.ts');
		try {
			await fs.access(configPath);
			logger.warn('storywright.config.ts already exists');
			return;
		} catch {
			// file doesn't exist, create it
		}

		await fs.writeFile(configPath, CONFIG_TEMPLATE);
		logger.success('Created storywright.config.ts');

		// Add .storywright to .gitignore if exists
		const gitignorePath = path.resolve('.gitignore');
		try {
			const content = await fs.readFile(gitignorePath, 'utf-8');
			if (!content.includes('.storywright')) {
				await fs.appendFile(gitignorePath, '\n.storywright/\n');
				logger.info('Added .storywright/ to .gitignore');
			}
		} catch {
			// no .gitignore
		}
	},
});
