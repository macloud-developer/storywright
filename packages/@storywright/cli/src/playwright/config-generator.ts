import type { StorywrightConfig } from '../config/types.js';

export function generatePlaywrightConfig(
	config: StorywrightConfig,
	options: {
		tmpDir: string;
		storybookUrl: string;
		snapshotDir: string;
		reporterPath: string;
		testFile: string;
		shard?: string;
		reporters?: string[];
	},
): string {
	const projects = config.browsers.map((browser) => {
		const browserOptions = config.browserOptions[browser];
		const useObj = browserOptions
			? JSON.stringify(browserOptions, null, '\t\t')
			: getDefaultBrowserUse(browser);
		return `\t\t{
\t\t\tname: '${browser}',
\t\t\tuse: ${useObj},
\t\t}`;
	});

	const workers = config.workers === 'auto' ? "'50%'" : String(config.workers);

	const shard = options.shard
		? `\tshard: { current: ${options.shard.split('/')[0]}, total: ${options.shard.split('/')[1]} },`
		: '';

	// Build reporter list: always include custom reporter, plus user-requested ones
	const reporterEntries: string[] = [];
	const requestedReporters = options.reporters ?? ['default', 'html'];
	for (const r of requestedReporters) {
		if (r === 'default' || r === 'list') {
			reporterEntries.push("\t\t['list']");
		} else if (r !== 'html') {
			// Pass through other built-in Playwright reporters (dot, json, junit, etc.)
			reporterEntries.push(`\t\t['${r}']`);
		}
	}
	// Always include custom storywright reporter
	reporterEntries.push(`\t\t['${escapeBackslash(options.reporterPath)}']`);

	return `import { defineConfig } from '@playwright/test';

export default defineConfig({
\ttestDir: '${escapeBackslash(options.tmpDir)}',
\ttestMatch: '${escapeBackslash(options.testFile)}',
\tsnapshotDir: '${escapeBackslash(options.snapshotDir)}',
\tsnapshotPathTemplate: '{snapshotDir}/{arg}-{projectName}-${config.screenshot.locale}-${config.screenshot.timezone}{ext}',
\ttimeout: ${config.timeout.test},
\texpect: {
\t\ttoHaveScreenshot: {
\t\t\tmaxDiffPixelRatio: ${config.screenshot.maxDiffPixelRatio},
\t\t\tthreshold: ${config.screenshot.threshold},
\t\t},
\t\ttimeout: ${config.timeout.expect},
\t},
\tfullyParallel: true,
\tforbidOnly: !!process.env.CI,
\tworkers: ${workers},
${shard}
\treporter: [
${reporterEntries.join(',\n')}
\t],
\tuse: {
\t\tbaseURL: '${options.storybookUrl}',
\t\tnavigationTimeout: ${config.timeout.navigation},
\t\ttimezoneId: '${config.screenshot.timezone}',
\t\tlocale: '${config.screenshot.locale}',
\t},
\tprojects: [
${projects.join(',\n')}
\t],
});
`;
}

function getDefaultBrowserUse(browser: string): string {
	switch (browser) {
		case 'chromium':
			return "{ browserName: 'chromium' }";
		case 'firefox':
			return "{ browserName: 'firefox' }";
		case 'webkit':
			return "{ browserName: 'webkit' }";
		default:
			return `{ browserName: '${browser}' }`;
	}
}

function escapeBackslash(str: string): string {
	return str.replace(/\\/g, '/');
}
