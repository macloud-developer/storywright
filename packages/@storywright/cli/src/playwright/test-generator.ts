import type { ScreenshotConfig } from "../config/types.js";

export function generateTestFile(
  config: ScreenshotConfig,
  options: {
    targetStoriesPath: string;
  },
): string {
  const disableAnimations = config.animations === "disabled";

  return `import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { initPage, stabilizePage } from '@storywright/cli/playwright/stabilize';

const targetList = JSON.parse(
\treadFileSync('${escapeBackslash(options.targetStoriesPath)}', 'utf-8'),
);

const stabilizeOptions = {
\tfreezeTime: '${config.freezeTime}',
\tseed: ${config.seed},
\tdisableAnimations: ${disableAnimations},
};

test.describe.parallel('visual regression testing', () => {
\tif (Object.keys(targetList.entries).length === 0) {
\t\ttest('no stories to test', () => {
\t\t\texpect(true).toBeTruthy();
\t\t});
\t}

\tfor (const story of Object.values(targetList.entries)) {
\t\ttest(\`\${story.title}: \${story.name}\`, async ({ page }, testInfo) => {
\t\t\tawait initPage(page, stabilizeOptions);

\t\t\tawait page.goto(\`/iframe.html?id=\${story.id}\`, {
\t\t\t\twaitUntil: 'domcontentloaded',
\t\t\t});

\t\t\tawait stabilizePage(page, stabilizeOptions);

\t\t\ttry {
\t\t\t\tawait expect(page).toHaveScreenshot(
\t\t\t\t\t[story.title, \`\${story.id}.png\`],
\t\t\t\t\t{
\t\t\t\t\t\tanimations: '${config.animations}',
\t\t\t\t\t\tfullPage: ${config.fullPage},
\t\t\t\t\t\tthreshold: ${config.threshold},
\t\t\t\t\t\tmaxDiffPixelRatio: ${config.maxDiffPixelRatio},
\t\t\t\t\t},
\t\t\t\t);
\t\t\t} catch (error) {
\t\t\t\t// When baseline is missing, Playwright skips screenshot capture entirely.
\t\t\t\t// Capture one here so the report can show what the new story looks like.
\t\t\t\tif (!testInfo.attachments.some(a => a.name.includes('-actual'))) {
\t\t\t\t\ttry {
\t\t\t\t\t\tconst screenshot = await page.screenshot({ fullPage: ${config.fullPage} });
\t\t\t\t\t\tawait testInfo.attach(\`\${story.id}-actual\`, { body: screenshot, contentType: 'image/png' });
\t\t\t\t\t} catch {
\t\t\t\t\t\t// ignore — best effort
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\tthrow error;
\t\t\t}
\t\t});
\t}
});
`;
}

function escapeBackslash(str: string): string {
  return str.replace(/\\/g, "/");
}
