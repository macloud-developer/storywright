import { describe, expect, it } from "vite-plus/test";
import { loadConfig } from "../src/config/index.js";

describe("loadConfig deep merge", () => {
  it("should preserve nested defaults when partially overriding", async () => {
    const config = await loadConfig(process.cwd(), {
      storage: {
        s3: {
          bucket: "my-bucket",
        },
      },
    });

    // Overridden value
    expect(config.storage.s3.bucket).toBe("my-bucket");
    // Preserved defaults
    expect(config.storage.s3.region).toBe("ap-northeast-1");
    expect(config.storage.s3.prefix).toBe("storywright/baselines");
    expect(config.storage.s3.compression).toBe("zstd");
    expect(config.storage.provider).toBe("local");
  });

  it("should preserve nested screenshot defaults when partially overriding", async () => {
    const config = await loadConfig(process.cwd(), {
      screenshot: {
        threshold: 0.05,
      },
    });

    expect(config.screenshot.threshold).toBe(0.05);
    // Preserved defaults
    expect(config.screenshot.fullPage).toBe(true);
    expect(config.screenshot.animations).toBe("disabled");
    expect(config.screenshot.maxDiffPixelRatio).toBe(0.02);
    expect(config.screenshot.freezeTime).toBe("2024-01-01T00:00:00");
  });
});
