import { loadConfig as unconfigLoad } from "unconfig";
import { DEFAULT_CONFIG } from "./defaults.js";
import { STANDARD_BROWSERS } from "./types.js";
import type { DeepPartial, StorywrightConfig } from "./types.js";

export function defineConfig(
  config: DeepPartial<StorywrightConfig>,
): DeepPartial<StorywrightConfig> {
  return config;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = result[key];
    if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result;
}

export async function loadConfig(
  cwd: string = process.cwd(),
  overrides?: DeepPartial<StorywrightConfig>,
): Promise<StorywrightConfig> {
  const { config: userConfig } = await unconfigLoad<DeepPartial<StorywrightConfig>>({
    sources: [
      {
        files: "storywright.config",
        extensions: ["ts", "js", "mjs"],
      },
    ],
    cwd,
  });

  let merged = DEFAULT_CONFIG as unknown as Record<string, unknown>;
  if (userConfig) {
    merged = deepMerge(merged, userConfig as Record<string, unknown>);
  }
  if (overrides) {
    merged = deepMerge(merged, overrides as Record<string, unknown>);
  }
  const result = merged as unknown as StorywrightConfig;
  validateConfig(result);
  return result;
}

function validateConfig(config: StorywrightConfig): void {
  for (const browser of config.browsers) {
    const options = config.browserOptions[browser];

    if (!STANDARD_BROWSERS.has(browser) && !options?.browserName) {
      throw new Error(
        `Custom browser project '${browser}' requires 'browserName' in browserOptions.\nExample:\n  browserOptions: {\n    '${browser}': { browserName: 'webkit', ... }\n  }\nValid browserName values: 'chromium', 'firefox', 'webkit'.\n\nError code: SW_E_MISSING_BROWSER_NAME`,
      );
    }

    if (options?.browserName && !STANDARD_BROWSERS.has(options.browserName)) {
      throw new Error(
        `Invalid browserName '${options.browserName}' for browser project '${browser}'.\nValid values: 'chromium', 'firefox', 'webkit'.\n\nError code: SW_E_INVALID_BROWSER_NAME`,
      );
    }
  }
}

export type { StorywrightConfig, DeepPartial } from "./types.js";
