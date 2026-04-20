import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { NotificationContext } from "@storywright/cli";
import type { StorywrightConfig } from "@storywright/cli";
import type { TestSummary } from "@storywright/cli";
import { githubNotifier } from "../src/index.js";

const passedSummary: TestSummary = {
  total: 10,
  passed: 10,
  failed: 0,
  skipped: 0,
  duration: 5000,
  timestamp: "2026-01-01T00:00:00Z",
  browsers: ["chromium"],
  entries: Array.from({ length: 10 }, () => ({
    type: "pass" as const,
    story: "Story",
    variant: "Default",
    browser: "chromium",
    diffRatio: 0,
    expected: "",
    actual: "",
    diff: "",
  })),
};

const failedSummary: TestSummary = {
  ...passedSummary,
  passed: 8,
  failed: 2,
  entries: [
    {
      type: "diff",
      story: "Button",
      variant: "Primary",
      browser: "chromium",
      diffRatio: 0.05,
      expected: "",
      actual: "",
      diff: "",
    },
    {
      type: "diff",
      story: "Modal",
      variant: "Open",
      browser: "firefox",
      diffRatio: 0.1,
      expected: "",
      actual: "",
      diff: "",
    },
  ],
};

function makeContext(summary: TestSummary | undefined, exitCode = 0): NotificationContext {
  return {
    summary,
    exitCode,
    reportDir: ".storywright/report",
    config: {} as StorywrightConfig,
  };
}

const ghOptions = {
  token: "ghp_test",
  repository: "owner/repo",
  prNumber: 1,
};

describe("githubNotifier", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    for (const key of [
      "GITHUB_ACTIONS",
      "GITHUB_TOKEN",
      "GITHUB_REPOSITORY",
      "GITHUB_REF",
      "CIRCLECI",
      "CIRCLE_PULL_REQUEST",
      "CIRCLE_PROJECT_USERNAME",
      "CIRCLE_PROJECT_REPONAME",
      "STORYWRIGHT_GITHUB_TOKEN",
      "STORYWRIGHT_GITHUB_REPO",
      "STORYWRIGHT_PR_NUMBER",
    ]) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should return skipped when "on-diff" and no diffs', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const notifier = githubNotifier({ when: "on-diff", ...ghOptions });
    const result = await notifier.notify(makeContext(passedSummary));

    expect(result.posted).toBe(false);
    expect(result.skipped).toContain("no diffs");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return skipped when "on-diff" and no summary', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const notifier = githubNotifier({ when: "on-diff", ...ghOptions });
    const result = await notifier.notify(makeContext(undefined, 0));

    expect(result.posted).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return skipped when "on-error" and exitCode < 2', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const notifier = githubNotifier({ when: "on-error", ...ghOptions });
    const result = await notifier.notify(makeContext(failedSummary, 1));

    expect(result.posted).toBe(false);
    expect(result.skipped).toContain("no execution error");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should post when "on-error" and exitCode >= 2', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 1 }),
    });

    const notifier = githubNotifier({ when: "on-error", ...ghOptions });
    const result = await notifier.notify(makeContext(undefined, 2));

    expect(result.posted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should post when "on-diff" and diffs exist', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 1 }),
    });

    const notifier = githubNotifier({ when: "on-diff", ...ghOptions });
    const result = await notifier.notify(makeContext(failedSummary, 1));

    expect(result.posted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should return skipped when environment cannot be detected", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const notifier = githubNotifier();
    const result = await notifier.notify(makeContext(failedSummary));

    expect(result.posted).toBe(false);
    expect(result.skipped).toContain("GitHub environment not detected");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should post comment when conditions are met", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 1 }),
    });

    const notifier = githubNotifier({
      ...ghOptions,
      prNumber: 42,
    });

    const result = await notifier.notify(makeContext(failedSummary, 1));
    expect(result.posted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should post error markdown when summary is missing and exitCode >= 2", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 1 }),
    });

    const notifier = githubNotifier(ghOptions);
    const result = await notifier.notify(makeContext(undefined, 2));

    expect(result.posted).toBe(true);
    // Verify the POST body contains error markdown
    const postCall = fetchMock.mock.calls[1];
    const body = JSON.parse(postCall[1].body);
    expect(body.body).toContain("Execution error");
    expect(body.body).toContain("exit code 2");
  });
});
