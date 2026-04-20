import { describe, expect, it } from "vite-plus/test";
import { resolveReportUrl } from "../../src/notifier/report-url.js";
import type { ReportUrlContext } from "../../src/notifier/report-url.js";

const baseCtx: ReportUrlContext = {
  prNumber: 123,
  branch: "feat/new-button",
  sha: "abc123def456789012345678901234567890abcd",
  shortSha: "abc123d",
  timestamp: "20260419T120000",
};

describe("resolveReportUrl", () => {
  it("should resolve all template variables", () => {
    const template =
      "https://cdn.example.com/${prNumber}/${branch}/${sha}/${shortSha}/${timestamp}/report";
    const result = resolveReportUrl(template, baseCtx);
    expect(result).toBe(
      "https://cdn.example.com/123/feat%2Fnew-button/abc123def456789012345678901234567890abcd/abc123d/20260419T120000/report",
    );
  });

  it("should resolve prNumber to empty string when undefined", () => {
    const template = "https://cdn.example.com/${prNumber}/report";
    const result = resolveReportUrl(template, { ...baseCtx, prNumber: undefined });
    expect(result).toBe("https://cdn.example.com//report");
  });

  it("should URL-encode branch names with special characters", () => {
    const template = "https://cdn.example.com/${branch}/report";

    expect(resolveReportUrl(template, { ...baseCtx, branch: "feat/日本語" })).toBe(
      "https://cdn.example.com/feat%2F%E6%97%A5%E6%9C%AC%E8%AA%9E/report",
    );

    expect(resolveReportUrl(template, { ...baseCtx, branch: "fix/bug #1" })).toBe(
      "https://cdn.example.com/fix%2Fbug%20%231/report",
    );
  });

  it("should pass through template with no variables", () => {
    const template = "https://cdn.example.com/static/report/index.html";
    const result = resolveReportUrl(template, baseCtx);
    expect(result).toBe("https://cdn.example.com/static/report/index.html");
  });

  it("should handle multiple occurrences of the same variable", () => {
    const template = "https://cdn.example.com/${prNumber}/vrt/${prNumber}/report";
    const result = resolveReportUrl(template, baseCtx);
    expect(result).toBe("https://cdn.example.com/123/vrt/123/report");
  });
});
