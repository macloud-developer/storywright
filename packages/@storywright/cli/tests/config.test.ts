import { describe, expect, it } from "vite-plus/test";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import { loadConfig } from "../src/config/index.js";

describe("DEFAULT_CONFIG", () => {
  it("should have expected default values", () => {
    expect(DEFAULT_CONFIG.browsers).toEqual(["chromium"]);
    expect(DEFAULT_CONFIG.screenshot.threshold).toBe(0.02);
    expect(DEFAULT_CONFIG.screenshot.maxDiffPixelRatio).toBe(0.02);
    expect(DEFAULT_CONFIG.screenshot.fullPage).toBe(true);
    expect(DEFAULT_CONFIG.screenshot.animations).toBe("disabled");
    expect(DEFAULT_CONFIG.screenshot.freezeTime).toBe("2024-01-01T00:00:00");
    expect(DEFAULT_CONFIG.storage.provider).toBe("local");
    expect(DEFAULT_CONFIG.storage.local.baselineDir).toBe(".storywright/baselines");
    expect(DEFAULT_CONFIG.workers).toBe("auto");
    expect(DEFAULT_CONFIG.diffDetection.enabled).toBe(true);
    expect(DEFAULT_CONFIG.diffDetection.baseBranch).toBe("main");
  });
});

describe("config validation", () => {
  it("should reject custom browser without browserName", async () => {
    await expect(
      loadConfig(process.cwd(), {
        browsers: ["mobile-safari"],
        browserOptions: {
          "mobile-safari": { viewport: { width: 390, height: 844 } },
        },
      }),
    ).rejects.toThrow("SW_E_MISSING_BROWSER_NAME");
  });

  it("should reject invalid browserName", async () => {
    await expect(
      loadConfig(process.cwd(), {
        browsers: ["mobile-safari"],
        browserOptions: {
          "mobile-safari": { browserName: "safari" as never },
        },
      }),
    ).rejects.toThrow("SW_E_INVALID_BROWSER_NAME");
  });

  it("should accept standard browsers without browserName", async () => {
    const config = await loadConfig(process.cwd(), {
      browsers: ["chromium", "webkit"],
    });
    expect(config.browsers).toEqual(["chromium", "webkit"]);
  });

  it("should accept custom browser with valid browserName", async () => {
    const config = await loadConfig(process.cwd(), {
      browsers: ["mobile-safari"],
      browserOptions: {
        "mobile-safari": { browserName: "webkit" },
      },
    });
    expect(config.browsers).toEqual(["mobile-safari"]);
    expect(config.browserOptions["mobile-safari"].browserName).toBe("webkit");
  });
});
