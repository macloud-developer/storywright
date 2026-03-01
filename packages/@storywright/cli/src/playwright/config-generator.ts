import { STANDARD_BROWSERS } from '../config/types.js';
import type { BrowserOption, StorywrightConfig } from '../config/types.js';

export function generatePlaywrightConfig(
	config: StorywrightConfig,
	options: {
		tmpDir: string;
		storybookUrl: string;
		snapshotDir: string;
		reporterPath: string;
		testMatch: string;
		testMatchByBrowser?: Record<string, string>;
		shard?: string;
		reporters?: string[];
	},
): string {
	const projects = config.browsers.map((browser) => {
		const rawOptions = config.browserOptions[browser];
		const useObj = buildBrowserUseObject(browser, rawOptions);
		const useStr = JSON.stringify(useObj, null, '\t\t');
		const testMatch = options.testMatchByBrowser?.[browser];
		const testMatchLine = testMatch ? `\n\t\t\ttestMatch: '${escapeBackslash(testMatch)}',` : '';
		return `\t\t{
\t\t\tname: '${browser}',${testMatchLine}
\t\t\tuse: ${useStr},
\t\t}`;
	});

	const workers = config.workers === 'auto' ? "'100%'" : String(config.workers);

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

	const testMatchLine = options.testMatchByBrowser
		? ''
		: `\ttestMatch: '${escapeBackslash(options.testMatch)}',\n`;

	return `import { defineConfig } from '@playwright/test';

export default defineConfig({
\ttestDir: '${escapeBackslash(options.tmpDir)}',
${testMatchLine}\tsnapshotDir: '${escapeBackslash(options.snapshotDir)}',
\tsnapshotPathTemplate: '{snapshotDir}/{arg}-{projectName}{ext}',
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
\tretries: ${config.retries},
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

function buildBrowserUseObject(
	browser: string,
	rawOptions?: BrowserOption,
): Record<string, unknown> {
	let browserName: string;
	if (rawOptions?.browserName) {
		browserName = rawOptions.browserName;
	} else if (STANDARD_BROWSERS.has(browser)) {
		browserName = browser;
	} else {
		throw new Error(
			`Cannot resolve browserName for custom browser project '${browser}'.\n\nError code: SW_E_INTERNAL_BROWSER_RESOLVE`,
		);
	}
	const useObj: Record<string, unknown> = { browserName };

	if (rawOptions) {
		const { browserName: _, exclude: __, ...rest } = rawOptions;
		Object.assign(useObj, rest);
	}

	return useObj;
}

function escapeBackslash(str: string): string {
	return str.replace(/\\/g, '/');
}
