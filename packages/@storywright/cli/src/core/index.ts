import path from "node:path";
import { loadConfig } from "../config/index.js";
import type { DeepPartial, StorywrightConfig } from "../config/types.js";
import { formatSummary } from "../reporter/cli-reporter.js";
import { createStorageAdapter } from "../storage/index.js";
import { LocalStorageAdapter } from "../storage/local.js";
import { type TestRunResult, runTests, updateBaselines } from "./engine.js";

export interface Storywright {
  test(options?: {
    diffOnly?: boolean;
    browsers?: string[];
    shard?: string;
    filter?: string;
  }): Promise<TestRunResult>;

  update(options?: { all?: boolean }): Promise<TestRunResult>;
  upload(options?: { shard?: string }): Promise<void>;
  download(options?: { branch?: string }): Promise<void>;
  generateReport(result: TestRunResult): string | undefined;
}

export async function createStorywright(
  userConfig?: DeepPartial<StorywrightConfig>,
  cwd: string = process.cwd(),
): Promise<Storywright> {
  const config = await loadConfig(cwd, userConfig);

  return {
    async test(options = {}) {
      const overrides: DeepPartial<StorywrightConfig> = {};
      if (options.browsers) {
        overrides.browsers = options.browsers;
      }
      const mergedConfig = options.browsers
        ? await loadConfig(cwd, { ...userConfig, ...overrides })
        : config;

      return runTests(
        mergedConfig,
        {
          diffOnly: options.diffOnly,
          shard: options.shard,
          filter: options.filter,
        },
        cwd,
      );
    },

    async update(options = {}) {
      return updateBaselines(config, { all: options.all }, cwd);
    },

    async upload(options = {}) {
      const storage = await createStorageAdapter(config.storage);
      await storage.upload({
        branch: "current",
        sourceDir: path.resolve(cwd, config.storage.local.baselineDir),
        shard: options.shard,
      });
    },

    async download(options = {}) {
      const storage = await createStorageAdapter(config.storage);
      const destDir = path.resolve(cwd, config.storage.local.baselineDir);
      const branch = options.branch ?? "main";

      if (storage instanceof LocalStorageAdapter) {
        await storage.downloadFromGit(branch, destDir, cwd);
      } else {
        await storage.download({ branch, destDir });
      }
    },

    generateReport(result: TestRunResult): string | undefined {
      if (result.summary) {
        const reportPath = result.reportDir ? `${result.reportDir}/index.html` : undefined;
        return formatSummary(result.summary, { reportPath });
      }
      return undefined;
    },
  };
}
