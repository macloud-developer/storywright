import type { ScreenshotConfig } from '../config/types.js';

export function generateTestFile(
	config: ScreenshotConfig,
	options: {
		targetStoriesPath: string;
	},
): string {
	const disableAnimations = config.animations === 'disabled';

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
\t\t\t\twaitUntil: 'domcontentloaded',
\t\t\t});
${
	disableAnimations
		? `
\t\t\t// Force-disable all CSS animations and transitions
\t\t\tawait page.addStyleTag({
\t\t\t\tcontent: '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }',
\t\t\t});
`
		: ''
}
\t\t\t// Wait for story to render: content inside #storybook-root OR portal content on body
\t\t\tawait page.waitForFunction(() => {
\t\t\t\tconst root = document.getElementById('storybook-root');
\t\t\t\tif (!root) return false;
\t\t\t\tif (root.childElementCount > 0) return true;
\t\t\t\t// Portal: check for elements on body that aren't part of Storybook's skeleton
\t\t\t\tfor (const el of document.body.children) {
\t\t\t\t\tif (el.tagName === 'SCRIPT' || el.id === 'storybook-root' || el.id === 'storybook-docs') continue;
\t\t\t\t\treturn true;
\t\t\t\t}
\t\t\t\treturn false;
\t\t\t}, { timeout: 10000 });

\t\t\t// Wait for web fonts to finish loading
\t\t\tawait page.waitForFunction(() => document.fonts.ready);

\t\t\t// Allow async renders to settle (multiple animation frames)
\t\t\t// This must run BEFORE image checks so the framework has finished adding
\t\t\t// all <img> elements to the DOM
\t\t\tawait page.waitForFunction(
\t\t\t\t() =>
\t\t\t\t\tnew Promise((resolve) => {
\t\t\t\t\t\tlet count = 0;
\t\t\t\t\t\tconst tick = () => {
\t\t\t\t\t\t\tif (++count >= 3) return resolve(true);
\t\t\t\t\t\t\trequestAnimationFrame(tick);
\t\t\t\t\t\t};
\t\t\t\t\t\trequestAnimationFrame(tick);
\t\t\t\t\t}),
\t\t\t);

\t\t\t// Force lazy-loaded images to eager and wait for load
\t\t\tawait page.evaluate(async () => {
\t\t\t\tconst lazyImages = document.querySelectorAll('img[loading="lazy"]');
\t\t\t\tfor (const img of lazyImages) {
\t\t\t\t\t(img as HTMLImageElement).loading = 'eager';
\t\t\t\t}

\t\t\t\tconst images = Array.from(document.images).filter((img) => !img.complete);
\t\t\t\tawait Promise.all(
\t\t\t\t\timages.map(
\t\t\t\t\t\t(img) =>
\t\t\t\t\t\t\tnew Promise<void>((resolve) => {
\t\t\t\t\t\t\t\tconst timeout = setTimeout(resolve, 5000);
\t\t\t\t\t\t\t\timg.onload = img.onerror = () => {
\t\t\t\t\t\t\t\t\tclearTimeout(timeout);
\t\t\t\t\t\t\t\t\tresolve();
\t\t\t\t\t\t\t\t};
\t\t\t\t\t\t\t}),
\t\t\t\t\t),
\t\t\t\t);
\t\t\t});
${
	disableAnimations
		? `
\t\t\t// Force opacity:1 on images to counteract fade-in effects
\t\t\tawait page.evaluate(() => {
\t\t\t\tdocument.querySelectorAll('img').forEach((img) => {
\t\t\t\t\timg.style.setProperty('opacity', '1', 'important');
\t\t\t\t});
\t\t\t});
`
		: ''
}
\t\t\t// Final stabilization delay for layout shifts
\t\t\tawait page.waitForTimeout(200);

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
