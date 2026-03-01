/// <reference types="node" />
import { readFileSync } from 'fs';
import { defineConfig } from 'tsup';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		cli: 'src/cli/index.ts',
		'playwright/reporter': 'src/playwright/reporter.ts',
	},
	format: ['esm'],
	dts: true,
	clean: true,
	target: 'node20',
	splitting: true,
	sourcemap: true,
	external: ['@playwright/test'],
	define: {
		__PKG_VERSION__: JSON.stringify(version),
	},
});
