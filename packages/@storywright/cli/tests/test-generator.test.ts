import { describe, expect, it } from "vite-plus/test";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import { generateTestFile } from "../src/playwright/test-generator.js";

const baseOptions = {
  targetStoriesPath: "/tmp/test/stories.json",
};

describe("generateTestFile", () => {
  it("should pass testInfo as second parameter to each test", () => {
    const result = generateTestFile(DEFAULT_CONFIG.screenshot, baseOptions);
    expect(result).toContain("async ({ page }, testInfo) =>");
  });

  it("should wrap toHaveScreenshot in try-catch", () => {
    const result = generateTestFile(DEFAULT_CONFIG.screenshot, baseOptions);
    expect(result).toContain("try {");
    expect(result).toContain("} catch (error) {");
  });

  it("should capture screenshot on failure when no actual attachment exists", () => {
    const result = generateTestFile(DEFAULT_CONFIG.screenshot, baseOptions);
    expect(result).toContain("testInfo.attachments.some(a => a.name.includes('-actual'))");
    expect(result).toContain("page.screenshot(");
    expect(result).toContain("testInfo.attach(");
  });

  it("should attach the fallback screenshot by file path, not an in-memory body", () => {
    // Playwright keeps body-only attachments in memory without a `path`, and the
    // reporter only copies attachments that expose a `path`. The fallback must
    // write to disk and attach via `path` so new-story images reach the report.
    const result = generateTestFile(DEFAULT_CONFIG.screenshot, baseOptions);
    expect(result).toContain("testInfo.outputPath(`${story.id}-actual.png`)");
    expect(result).toContain("page.screenshot({ path: actualPath");
    expect(result).toContain("testInfo.attach(`${story.id}-actual`, { path: actualPath");
    expect(result).not.toContain("body: screenshot");
  });

  it("should rethrow the original error", () => {
    const result = generateTestFile(DEFAULT_CONFIG.screenshot, baseOptions);
    expect(result).toContain("throw error;");
  });

  it("should use fullPage setting from config in fallback screenshot", () => {
    const config = { ...DEFAULT_CONFIG.screenshot, fullPage: false };
    const result = generateTestFile(config, baseOptions);
    // Both toHaveScreenshot and fallback page.screenshot should use the config value
    expect(result).toContain("fullPage: false");
  });

  it("should use story id in the attachment name with -actual suffix", () => {
    const result = generateTestFile(DEFAULT_CONFIG.screenshot, baseOptions);
    expect(result).toMatch(/testInfo\.attach\(`\$\{story\.id\}-actual`/);
  });

  it("should include stabilize and navigation setup", () => {
    const result = generateTestFile(DEFAULT_CONFIG.screenshot, baseOptions);
    expect(result).toContain("initPage(page, stabilizeOptions)");
    expect(result).toContain("stabilizePage(page, stabilizeOptions)");
    expect(result).toContain("/iframe.html?id=");
  });
});
