import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		cli: 'src/cli/index.ts',
		'playwright/reporter': 'src/playwright/reporter.ts',
	},
	format: ['esm'],
	dts: true,
	clean: true,
	target: 'node18',
	splitting: true,
	sourcemap: true,
	external: ['@playwright/test'],
});
