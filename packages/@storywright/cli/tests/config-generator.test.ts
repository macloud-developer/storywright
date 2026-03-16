import { describe, expect, it } from "vite-plus/test";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import { generatePlaywrightConfig } from "../src/playwright/config-generator.js";

const baseOptions = {
  tmpDir: "/tmp/test",
  storybookUrl: "http://localhost:6007",
  snapshotDir: "/tmp/test/snapshots",
  reporterPath: "/tmp/test/reporter.mjs",
  testMatch: "storywright-*.spec.ts",
};

describe("generatePlaywrightConfig", () => {
  it("should include browserName for standard browsers", () => {
    const result = generatePlaywrightConfig(DEFAULT_CONFIG, baseOptions);
    expect(result).toContain('"browserName": "chromium"');
  });

  it("should include browserName even when browserOptions has other fields", () => {
    const config = {
      ...DEFAULT_CONFIG,
      browserOptions: {
        chromium: { viewport: { width: 1920, height: 1080 } },
      },
    };
    const result = generatePlaywrightConfig(config, baseOptions);
    expect(result).toContain('"browserName": "chromium"');
    expect(result).toContain('"width": 1920');
  });

  it("should map custom browser to the specified browserName", () => {
    const config = {
      ...DEFAULT_CONFIG,
      browsers: ["chromium", "mobile-safari"] as string[],
      browserOptions: {
        "mobile-safari": {
          browserName: "webkit" as const,
          viewport: { width: 390, height: 844 },
          isMobile: true,
        },
      },
    };
    const result = generatePlaywrightConfig(config, baseOptions);
    expect(result).toContain("name: 'mobile-safari'");
    expect(result).toContain('"browserName": "webkit"');
    expect(result).toContain('"isMobile": true');
  });

  it("should not include exclude in the use object", () => {
    const config = {
      ...DEFAULT_CONFIG,
      browserOptions: {
        chromium: { exclude: ["**/Mobile/**"] },
      },
    };
    const result = generatePlaywrightConfig(config, baseOptions);
    expect(result).not.toContain("exclude");
    expect(result).not.toContain("Mobile");
  });

  it("should set per-project testMatch when testMatchByBrowser is provided", () => {
    const result = generatePlaywrightConfig(DEFAULT_CONFIG, {
      ...baseOptions,
      testMatchByBrowser: {
        chromium: "storywright-chromium-*.spec.ts",
      },
    });
    expect(result).toContain("testMatch: 'storywright-chromium-*.spec.ts'");
  });

  it("should omit global testMatch when testMatchByBrowser is provided", () => {
    const result = generatePlaywrightConfig(DEFAULT_CONFIG, {
      ...baseOptions,
      testMatchByBrowser: {
        chromium: "storywright-chromium-*.spec.ts",
      },
    });
    // Global testMatch line should not appear
    expect(result).not.toMatch(/^\ttestMatch:/m);
  });

  it("should include global testMatch when testMatchByBrowser is not provided", () => {
    const result = generatePlaywrightConfig(DEFAULT_CONFIG, baseOptions);
    expect(result).toContain("testMatch: 'storywright-*.spec.ts'");
  });
});
