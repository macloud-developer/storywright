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
\t\ttest(\`\${story.title}: \${story.name}\`, async ({ page }) => {
\t\t\tawait initPage(page, stabilizeOptions);

\t\t\tawait page.goto(\`/iframe.html?id=\${story.id}\`, {
\t\t\t\twaitUntil: 'domcontentloaded',
\t\t\t});

\t\t\tawait stabilizePage(page, stabilizeOptions);

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
  return str.replace(/\\/g, "/");
}
