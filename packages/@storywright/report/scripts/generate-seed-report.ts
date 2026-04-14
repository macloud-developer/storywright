/**
 * 開発用: ダミーの summary.json を public/ に生成するスクリプト
 *
 * Usage:
 *   npx tsx scripts/generate-seed-report.ts [件数]
 *   pnpm seed-report         # package.json の scripts から
 *   pnpm seed-report 2000    # 件数指定
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface TestEntry {
  type: "diff" | "new" | "pass";
  story: string;
  variant: string;
  browser: string;
  diffRatio: number;
  expected: string;
  actual: string;
  diff: string;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  timestamp: string;
  browsers: string[];
  entries: TestEntry[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const count = Number(process.argv[2]) || 1000;

const browsers = ["chromium", "firefox", "webkit"];
const types: TestEntry["type"][] = ["diff", "new", "pass"];
const stories = Array.from({ length: Math.ceil(count / 3) }, (_, i) => `Story ${i + 1}`);
const variants = ["default", "hover", "focus", "disabled", "loading"];

const entries: TestEntry[] = [];
for (let i = 0; i < count; i++) {
  const type = types[i % types.length]!;
  const story = stories[Math.floor(i / 3)]!;
  const variant = variants[i % variants.length]!;
  const browser = browsers[i % browsers.length]!;
  entries.push({
    type,
    story,
    variant,
    browser,
    diffRatio: type === "diff" ? Math.random() * 0.5 : 0,
    expected: type === "diff" ? `assets/expected/placeholder-${i}.png` : "",
    actual: type !== "pass" ? `assets/actual/placeholder-${i}.png` : "",
    diff: type === "diff" ? `assets/diff/placeholder-${i}.png` : "",
  });
}

const passed = entries.filter((e) => e.type === "pass").length;
const failed = entries.filter((e) => e.type !== "pass").length;

const summary: TestSummary = {
  total: count,
  passed,
  failed,
  skipped: 0,
  duration: count * 120,
  timestamp: new Date().toISOString(),
  browsers,
  entries,
};

const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
fs.mkdirSync(publicDir, { recursive: true });

const outPath = path.join(publicDir, "summary.json");
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

// dev 用の index.html がなければ生成
const indexPath = path.join(rootDir, "index.html");
if (!fs.existsSync(indexPath)) {
  fs.writeFileSync(
    indexPath,
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Storywright Report (dev)</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
  );
  console.log(`✔ Created ${indexPath}`);
}

console.log(`✔ Generated ${count} entries → ${outPath}`);
