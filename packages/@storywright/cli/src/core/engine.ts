import fs from "node:fs/promises";
import path from "node:path";
import picomatch from "picomatch";
import type { StorywrightConfig } from "../config/types.js";
import { generatePlaywrightConfig } from "../playwright/config-generator.js";
import { generateTestFile } from "../playwright/test-generator.js";
import { resolveAffectedStories } from "../resolver/index.js";
import { createStorageAdapter } from "../storage/index.js";
import { logger } from "../utils/logger.js";
import { resolveOutputDir } from "../utils/path.js";
import { exec } from "../utils/process.js";
import {
  buildStorybook,
  discoverStories,
  excludeStoriesForBrowser,
  filterStories,
} from "./storybook.js";
import type { Story, StoryIndex, TestSummary } from "./types.js";

export interface TestOptions {
  diffOnly?: boolean;
  shard?: string;
  updateSnapshots?: boolean;
  filter?: string;
  outputDir?: string;
  reporters?: string[];
}

export interface TestRunResult {
  exitCode: number;
  summary?: TestSummary;
  reportDir?: string;
  snapshotDir?: string;
}

const STORIES_PER_FILE = 50;

function resolveReporterPath(): string {
  // Resolve relative to this file's dist location
  const thisDir = new URL(".", import.meta.url).pathname;
  return path.resolve(thisDir, "playwright", "reporter.js");
}

function chunkStories(entries: Record<string, Story>): Record<string, Story>[] {
  const keys = Object.keys(entries);
  if (keys.length === 0) return [{}];
  const chunks: Record<string, Story>[] = [];
  for (let i = 0; i < keys.length; i += STORIES_PER_FILE) {
    const chunk: Record<string, Story> = {};
    for (const key of keys.slice(i, i + STORIES_PER_FILE)) {
      chunk[key] = entries[key];
    }
    chunks.push(chunk);
  }
  return chunks;
}

export async function runTests(
  config: StorywrightConfig,
  options: TestOptions = {},
  cwd: string = process.cwd(),
): Promise<TestRunResult> {
  const outputRoot = options.outputDir
    ? path.resolve(cwd, options.outputDir)
    : resolveOutputDir(cwd, ".storywright");
  const tmpDir = path.join(outputRoot, "tmp");
  const reportDir = options.outputDir
    ? path.join(outputRoot, "report")
    : path.resolve(cwd, config.report.outputDir);
  const storybookDir = path.resolve(cwd, config.storybook.staticDir);
  const snapshotDir = path.join(tmpDir, "snapshots");

  // Prepare directories early for parallel operations
  await fs.mkdir(snapshotDir, { recursive: true });

  // Start baseline download in parallel with Storybook build
  // Skip download when updating snapshots (update command) — baselines are regenerated
  let baselinePromise: Promise<void> | undefined;
  if (!options.updateSnapshots) {
    const storage = await createStorageAdapter(config.storage);
    baselinePromise = storage
      .download({
        branch: config.storage.branch,
        destDir: snapshotDir,
        onProgress: (msg) => logger.info(msg),
      })
      .catch(() => {
        logger.info("No existing baselines found");
      });
  }

  // 1. Build Storybook if needed
  await buildStorybook(config, cwd);

  // 2. Discover & filter stories
  logger.start("Discovering stories...");
  const allStories = await discoverStories(config, cwd);
  let targetStories = filterStories(allStories, config);

  // Apply --filter option
  if (options.filter) {
    targetStories = applyFilter(targetStories, options.filter);
  }

  logger.info(`${Object.keys(targetStories.entries).length} stories found`);

  // 3. Diff-only: resolve affected stories (default in CI)
  const effectiveDiffOnly = options.diffOnly ?? !!process.env.CI;
  if (effectiveDiffOnly && config.diffDetection.enabled) {
    logger.start("Resolving dependencies...");
    const diffResult = await resolveAffectedStories(
      targetStories,
      config.diffDetection,
      storybookDir,
      cwd,
    );
    if (!diffResult.allStories) {
      targetStories = diffResult.targetStories;
    }
    logger.info(`${Object.keys(targetStories.entries).length} stories affected by changes`);
  }

  // 4. Wait for baseline download to complete
  await baselinePromise;

  // 5. Generate split test files for better worker distribution
  let testFilePattern: string;
  let testMatchByBrowser: Record<string, string> | undefined;

  const browserExcludesExist = config.browsers.some(
    (b) => (config.browserOptions[b]?.exclude ?? []).length > 0,
  );

  if (browserExcludesExist) {
    // Generate per-browser test files when any browser has specific excludes
    testMatchByBrowser = {};

    for (const browser of config.browsers) {
      const browserExclude = config.browserOptions[browser]?.exclude ?? [];
      const browserStories = excludeStoriesForBrowser(targetStories, browserExclude);

      if (Object.keys(browserStories.entries).length === 0) {
        logger.warn(
          `${browser}: All stories excluded by browser-specific 'exclude' patterns. No tests will run for this browser.`,
        );
      }

      const browserChunks = chunkStories(browserStories.entries);

      testMatchByBrowser[browser] =
        browserChunks.length === 1
          ? `storywright-${browser}-0.spec.ts`
          : `storywright-${browser}-*.spec.ts`;

      for (let i = 0; i < browserChunks.length; i++) {
        const chunkIndex: StoryIndex = {
          ...browserStories,
          entries: browserChunks[i],
        };
        const chunkPath = path.join(tmpDir, `target-stories-${browser}-${i}.json`);
        await fs.writeFile(chunkPath, JSON.stringify(chunkIndex));

        const testContent = generateTestFile(config.screenshot, {
          targetStoriesPath: chunkPath.replace(/\\/g, "/"),
        });
        await fs.writeFile(path.join(tmpDir, `storywright-${browser}-${i}.spec.ts`), testContent);
      }

      logger.info(
        `${browser}: ${Object.keys(browserStories.entries).length} stories, ${
          browserChunks.length
        } test file(s)`,
      );
    }

    testFilePattern = "storywright-*.spec.ts";
  } else {
    // Default: shared test files for all browsers
    const chunks = chunkStories(targetStories.entries);
    testFilePattern = chunks.length === 1 ? "storywright-0.spec.ts" : "storywright-*.spec.ts";

    for (let i = 0; i < chunks.length; i++) {
      const chunkIndex: StoryIndex = { ...targetStories, entries: chunks[i] };
      const chunkPath = path.join(tmpDir, `target-stories-${i}.json`);
      await fs.writeFile(chunkPath, JSON.stringify(chunkIndex));

      const testContent = generateTestFile(config.screenshot, {
        targetStoriesPath: chunkPath.replace(/\\/g, "/"),
      });
      await fs.writeFile(path.join(tmpDir, `storywright-${i}.spec.ts`), testContent);
    }

    logger.info(`${chunks.length} test file(s) generated`);
  }

  // 6. Generate Playwright config
  const reporterWrapperPath = path.join(tmpDir, "reporter.mjs");
  const resolvedReporterPath = resolveReporterPath().replace(/\\/g, "/");
  const reporterOutputDir = reportDir.replace(/\\/g, "/");

  await fs.writeFile(
    reporterWrapperPath,
    `import StorywrightReporter from '${resolvedReporterPath}';\nexport default class extends StorywrightReporter {\n  constructor() { super({ outputDir: '${reporterOutputDir}' }); }\n}\n`,
  );

  // Determine Storybook URL
  let actualStorybookUrl = config.storybook.url;
  const needsServer = !actualStorybookUrl;

  if (needsServer) {
    actualStorybookUrl = "http://localhost:6007";
  }

  const playwrightConfig = generatePlaywrightConfig(config, {
    tmpDir: tmpDir.replace(/\\/g, "/"),
    storybookUrl: actualStorybookUrl ?? "http://localhost:6007",
    snapshotDir: snapshotDir.replace(/\\/g, "/"),
    reporterPath: reporterWrapperPath.replace(/\\/g, "/"),
    testMatch: testFilePattern,
    testMatchByBrowser,
    shard: options.shard,
    reporters: options.reporters,
    updateSnapshots: options.updateSnapshots,
  });

  const configPath = path.join(tmpDir, "playwright.config.ts");
  await fs.writeFile(configPath, playwrightConfig);

  // 7. Run Playwright tests
  logger.start("Running tests...");
  const args = ["playwright", "test", "--config", configPath];

  if (options.updateSnapshots) {
    args.push("--update-snapshots");
  }

  // Start static server if needed
  let serverProc: { kill: () => void } | undefined;
  if (needsServer) {
    serverProc = await startStaticServer(storybookDir, 6007);
  }

  try {
    const result = await exec("npx", args, { cwd, inherit: true });

    // 8. Read results
    let summary: TestSummary | undefined;
    try {
      const summaryPath = path.join(reportDir, "summary.json");
      const summaryContent = await fs.readFile(summaryPath, "utf-8");
      summary = JSON.parse(summaryContent);
    } catch {
      // summary may not exist if no tests ran
    }

    // 9. Map exit codes per SPEC §14.2
    const exitCode = mapExitCode(result.exitCode, summary);

    return { exitCode, summary, reportDir, snapshotDir };
  } finally {
    serverProc?.kill();
  }
}

export async function updateBaselines(
  config: StorywrightConfig,
  options: {
    all?: boolean;
    upload?: boolean;
    shard?: string;
    filter?: string;
  } = {},
  cwd: string = process.cwd(),
): Promise<TestRunResult> {
  const result = await runTests(
    config,
    {
      updateSnapshots: true,
      diffOnly: !options.all,
      shard: options.shard,
      filter: options.filter,
    },
    cwd,
  );

  if (result.exitCode !== 0) {
    logger.warn("Some tests failed during baseline update");
  }

  // Save updated snapshots back to baselineDir (local disk operation)
  if (result.snapshotDir) {
    const baselineDir = path.resolve(cwd, config.storage.local.baselineDir);
    await fs.mkdir(baselineDir, { recursive: true });
    await fs.cp(result.snapshotDir, baselineDir, { recursive: true });
    logger.success(`Baselines saved to ${config.storage.local.baselineDir}`);
  }

  // --upload: upload to remote storage (S3 etc.) only when explicitly requested
  if (options.upload) {
    const storage = await createStorageAdapter(config.storage);
    const baselineDir = path.resolve(cwd, config.storage.local.baselineDir);
    await storage.upload({
      branch: config.storage.branch,
      sourceDir: baselineDir,
      shard: options.shard,
      onProgress: (msg) => logger.info(msg),
    });
    logger.success("Baselines uploaded to remote storage");
  }

  return result;
}

function applyFilter(storyIndex: StoryIndex, filter: string): StoryIndex {
  const matcher = picomatch(filter);
  const entries: Record<string, StoryIndex["entries"][string]> = {};
  for (const [id, story] of Object.entries(storyIndex.entries)) {
    const fullName = `${story.title}/${story.name}`;
    if (matcher(fullName) || matcher(story.title) || matcher(story.id)) {
      entries[id] = story;
    }
  }
  return { ...storyIndex, entries };
}

function mapExitCode(playwrightCode: number, summary?: TestSummary): number {
  // SPEC §14.2: 0 = success (no diff), 1 = success (diff found), 2 = execution error, 130 = SIGINT
  if (playwrightCode === 130 || playwrightCode === 143) {
    return 130; // SIGINT / SIGTERM
  }
  if (summary) {
    if (summary.failed > 0) return 1;
    if (summary.total === 0 && playwrightCode !== 0) return 2;
    return 0;
  }
  // No summary = likely execution error
  return playwrightCode === 0 ? 0 : 2;
}

async function startStaticServer(dir: string, port: number): Promise<{ kill: () => void }> {
  const { createServer } = await import("node:http");
  const sirv = (await import("sirv")).default;

  const handler = sirv(dir, { single: false, dev: false });
  const server = createServer(handler);

  await new Promise<void>((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, () => resolve());
  });

  return { kill: () => server.close() };
}
