import { describe, expect, it } from "vite-plus/test";
import type { TestSummary } from "@storywright/cli";
import { buildCommentMarkdown, MARKER } from "../src/markdown.js";

const baseSummary: TestSummary = {
  total: 10,
  passed: 10,
  failed: 0,
  skipped: 0,
  duration: 65000,
  timestamp: "2026-01-01T00:00:00Z",
  browsers: ["chromium"],
  entries: [],
};

const defaultOptions = {
  maxEntries: 10,
  collapseOnPass: true,
  deleteOnPass: false,
};

describe("buildCommentMarkdown", () => {
  it("should show 'All passed' for zero failures", () => {
    const md = buildCommentMarkdown(baseSummary, defaultOptions);
    expect(md).toContain("**Status:** All passed");
    expect(md).toContain("| Total | 10 |");
    expect(md).toContain("| Passed | 10 |");
    expect(md).not.toContain("| Failed");
    expect(md).not.toContain("差分一覧");
  });

  it("should show diff count for failures", () => {
    const summary: TestSummary = {
      ...baseSummary,
      passed: 7,
      failed: 3,
      entries: [
        {
          type: "diff",
          story: "Button",
          variant: "Primary",
          browser: "chromium",
          diffRatio: 0.025,
          expected: "",
          actual: "",
          diff: "",
        },
        {
          type: "diff",
          story: "Modal",
          variant: "Open",
          browser: "firefox",
          diffRatio: 0.08,
          expected: "",
          actual: "",
          diff: "",
        },
        {
          type: "new",
          story: "Card",
          variant: "Default",
          browser: "chromium",
          diffRatio: 0,
          expected: "",
          actual: "",
          diff: "",
        },
      ],
    };
    const md = buildCommentMarkdown(summary, defaultOptions);
    expect(md).toContain("3件のビジュアル差分を検出");
    expect(md).toContain("| Failed | 3 |");
    expect(md).toContain("### 差分一覧");
    expect(md).toContain("Button: Primary");
    expect(md).toContain("2.5%");
    expect(md).toContain("Modal: Open");
    expect(md).toContain("8.0%");
  });

  it("should collapse entries beyond maxEntries", () => {
    const entries = Array.from({ length: 15 }, (_, i) => ({
      type: "diff" as const,
      story: `Story${i}`,
      variant: "Default",
      browser: "chromium",
      diffRatio: 0.01,
      expected: "",
      actual: "",
      diff: "",
    }));
    const summary: TestSummary = { ...baseSummary, failed: 15, passed: 0, total: 15, entries };
    const md = buildCommentMarkdown(summary, { ...defaultOptions, maxEntries: 5 });
    expect(md).toContain("<details>");
    expect(md).toContain("他10件");
    expect(md).toContain("</details>");
  });

  it("should include report URL when provided", () => {
    const md = buildCommentMarkdown(baseSummary, {
      ...defaultOptions,
      reportUrl: "https://cdn.example.com/report/index.html",
    });
    expect(md).toContain("[レポートを開く](https://cdn.example.com/report/index.html)");
  });

  it("should not include report URL when not provided", () => {
    const md = buildCommentMarkdown(baseSummary, defaultOptions);
    expect(md).not.toContain("レポートを開く");
  });

  it("should always include marker at the end", () => {
    const md = buildCommentMarkdown(baseSummary, defaultOptions);
    expect(md).toContain(MARKER);
    expect(md.trimEnd().endsWith(MARKER)).toBe(true);
  });

  it("should format duration correctly", () => {
    const md1 = buildCommentMarkdown({ ...baseSummary, duration: 45000 }, defaultOptions);
    expect(md1).toContain("45s");

    const md2 = buildCommentMarkdown({ ...baseSummary, duration: 125000 }, defaultOptions);
    expect(md2).toContain("2m 5s");

    const md3 = buildCommentMarkdown({ ...baseSummary, duration: 120000 }, defaultOptions);
    expect(md3).toContain("2m");
  });

  it("should collapse details when collapseOnPass is true and all passed", () => {
    const md = buildCommentMarkdown(baseSummary, { ...defaultOptions, collapseOnPass: true });
    expect(md).toContain("<details>");
    expect(md).toContain("<summary>Details</summary>");
    expect(md).toContain("</details>");
  });

  it("should not collapse when collapseOnPass is true but there are diffs", () => {
    const summary: TestSummary = {
      ...baseSummary,
      failed: 1,
      passed: 9,
      entries: [
        {
          type: "diff",
          story: "Button",
          variant: "Primary",
          browser: "chromium",
          diffRatio: 0.01,
          expected: "",
          actual: "",
          diff: "",
        },
      ],
    };
    const md = buildCommentMarkdown(summary, { ...defaultOptions, collapseOnPass: true });
    expect(md).not.toContain("<summary>Details</summary>");
  });

  it("should not collapse when collapseOnPass is false", () => {
    const md = buildCommentMarkdown(baseSummary, { ...defaultOptions, collapseOnPass: false });
    expect(md).not.toContain("<summary>Details</summary>");
  });

  it("should show new entries count", () => {
    const summary: TestSummary = {
      ...baseSummary,
      failed: 0,
      entries: [
        {
          type: "new",
          story: "NewStory",
          variant: "Default",
          browser: "chromium",
          diffRatio: 0,
          expected: "",
          actual: "",
          diff: "",
        },
      ],
    };
    const md = buildCommentMarkdown(summary, defaultOptions);
    expect(md).toContain("| New | 1 |");
    expect(md).toContain("1件のビジュアル差分を検出");
  });
});
