import type { ScreenshotConfig } from '../config/types.js';

export function generateTestFile(
	config: ScreenshotConfig,
	options: {
		targetStoriesPath: string;
	},
): string {
	return `import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const targetList = JSON.parse(
\treadFileSync('${escapeBackslash(options.targetStoriesPath)}', 'utf-8'),
);

test.describe.parallel('visual regression testing', () => {
\tif (Object.keys(targetList.entries).length === 0) {
\t\ttest('no stories to test', () => {
\t\t\texpect(true).toBeTruthy();
\t\t});
\t}

\tfor (const story of Object.values(targetList.entries)) {
\t\ttest(\`\${story.title}: \${story.name}\`, async ({ page }) => {
\t\t\t// Freeze time for reproducibility
\t\t\tawait page.clock.install({ time: new Date('${config.freezeTime}') });

\t\t\t// Seed Math.random for reproducibility
\t\t\tawait page.addInitScript((seed) => {
\t\t\t\tlet s = seed;
\t\t\t\tMath.random = () => {
\t\t\t\t\ts = (s * 16807 + 0) % 2147483647;
\t\t\t\t\treturn (s - 1) / 2147483646;
\t\t\t\t};
\t\t\t}, ${config.seed});

\t\t\tawait page.goto(\`/iframe.html?id=\${story.id}\`, {
\t\t\t\twaitUntil: 'networkidle',
\t\t\t});

\t\t\t// Wait for Storybook to initialize (state: 'attached' for portals, hidden dialogs, fixed overlays)
\t\t\tawait page.waitForSelector('#storybook-root', { state: 'attached', timeout: 10000 });

\t\t\t// Wait for web fonts to finish loading
\t\t\tawait page.waitForFunction(() => document.fonts.ready);

\t\t\t// Allow async renders (portals, modals, lazy components) to settle
\t\t\tawait page.waitForFunction(() => new Promise(resolve => requestAnimationFrame(() => resolve(true))));

\t\t\tawait expect(page).toHaveScreenshot(
\t\t\t\t[story.title, \`\${story.id}.png\`],
\t\t\t\t{
\t\t\t\t\tanimations: '${config.animations}',
\t\t\t\t\tfullPage: ${config.fullPage},
\t\t\t\t\tthreshold: ${config.threshold},
\t\t\t\t\tmaxDiffPixelRatio: ${config.maxDiffPixelRatio},
\t\t\t\t},
\t\t\t);
\t\t});
\t}
});
`;
}

function escapeBackslash(str: string): string {
	return str.replace(/\\/g, '/');
}
