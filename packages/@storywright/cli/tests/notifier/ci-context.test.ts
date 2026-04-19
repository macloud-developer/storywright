import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import {
  detectCIContext,
  extractPrFromGitHubRef,
  extractPrFromUrl,
} from "../../src/notifier/ci-context.js";

describe("extractPrFromGitHubRef", () => {
  it("should extract PR number from refs/pull/N/merge", () => {
    expect(extractPrFromGitHubRef("refs/pull/123/merge")).toBe(123);
  });

  it("should extract PR number from refs/pull/N/head", () => {
    expect(extractPrFromGitHubRef("refs/pull/456/head")).toBe(456);
  });

  it("should return undefined for branch refs", () => {
    expect(extractPrFromGitHubRef("refs/heads/main")).toBeUndefined();
  });

  it("should return undefined for undefined input", () => {
    expect(extractPrFromGitHubRef(undefined)).toBeUndefined();
  });
});

describe("extractPrFromUrl", () => {
  it("should extract PR number from GitHub URL", () => {
    expect(extractPrFromUrl("https://github.com/owner/repo/pull/789")).toBe(789);
  });

  it("should return undefined for non-PR URL", () => {
    expect(extractPrFromUrl("https://github.com/owner/repo")).toBeUndefined();
  });

  it("should return undefined for undefined input", () => {
    expect(extractPrFromUrl(undefined)).toBeUndefined();
  });
});

describe("detectCIContext", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clear CI-related env vars
    for (const key of [
      "GITHUB_ACTIONS",
      "GITHUB_TOKEN",
      "GITHUB_REPOSITORY",
      "GITHUB_REF",
      "GITHUB_HEAD_REF",
      "GITHUB_SHA",
      "CIRCLECI",
      "CIRCLE_PULL_REQUEST",
      "CIRCLE_BRANCH",
      "CIRCLE_SHA1",
      "CIRCLE_PROJECT_USERNAME",
      "CIRCLE_PROJECT_REPONAME",
      "STORYWRIGHT_PR_NUMBER",
      "STORYWRIGHT_GITHUB_TOKEN",
      "STORYWRIGHT_GITHUB_REPO",
    ]) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should detect GitHub Actions environment", () => {
    process.env.GITHUB_ACTIONS = "true";
    process.env.GITHUB_TOKEN = "ghp_test";
    process.env.GITHUB_REPOSITORY = "owner/repo";
    process.env.GITHUB_REF = "refs/pull/42/merge";
    process.env.GITHUB_HEAD_REF = "feat/test";
    process.env.GITHUB_SHA = "abc123def456789012345678901234567890abcd";

    const ctx = detectCIContext();
    expect(ctx.provider).toBe("github-actions");
    expect(ctx.token).toBe("ghp_test");
    expect(ctx.repository).toBe("owner/repo");
    expect(ctx.prNumber).toBe(42);
    expect(ctx.branch).toBe("feat/test");
    expect(ctx.sha).toBe("abc123def456789012345678901234567890abcd");
    expect(ctx.shortSha).toBe("abc123d");
  });

  it("should detect CircleCI environment", () => {
    process.env.CIRCLECI = "true";
    process.env.GITHUB_TOKEN = "ghp_circle";
    process.env.CIRCLE_PULL_REQUEST = "https://github.com/owner/repo/pull/99";
    process.env.CIRCLE_BRANCH = "fix/bug";
    process.env.CIRCLE_SHA1 = "deadbeef12345678901234567890123456789012";
    process.env.CIRCLE_PROJECT_USERNAME = "owner";
    process.env.CIRCLE_PROJECT_REPONAME = "repo";

    const ctx = detectCIContext();
    expect(ctx.provider).toBe("circleci");
    expect(ctx.token).toBe("ghp_circle");
    expect(ctx.repository).toBe("owner/repo");
    expect(ctx.prNumber).toBe(99);
    expect(ctx.branch).toBe("fix/bug");
    expect(ctx.sha).toBe("deadbeef12345678901234567890123456789012");
  });

  it("should detect generic environment via STORYWRIGHT_* vars", () => {
    process.env.STORYWRIGHT_PR_NUMBER = "55";
    process.env.STORYWRIGHT_GITHUB_TOKEN = "ghp_generic";
    process.env.STORYWRIGHT_GITHUB_REPO = "org/project";

    const ctx = detectCIContext();
    expect(ctx.provider).toBe("generic");
    expect(ctx.token).toBe("ghp_generic");
    expect(ctx.repository).toBe("org/project");
    expect(ctx.prNumber).toBe(55);
  });

  it("should fall back to local when no CI detected", () => {
    const ctx = detectCIContext();
    expect(ctx.provider).toBe("local");
    expect(ctx.prNumber).toBeUndefined();
    expect(ctx.sha).toBeTruthy();
    // branch may be empty on detached HEAD (e.g. GitHub Actions checkout)
    expect(typeof ctx.branch).toBe("string");
  });

  it("should apply overrides over detected values", () => {
    process.env.GITHUB_ACTIONS = "true";
    process.env.GITHUB_TOKEN = "ghp_auto";
    process.env.GITHUB_REPOSITORY = "auto/repo";
    process.env.GITHUB_REF = "refs/pull/1/merge";
    process.env.GITHUB_SHA = "abc123def456789012345678901234567890abcd";

    const ctx = detectCIContext({
      prNumber: 999,
      token: "ghp_override",
      repository: "override/repo",
    });
    expect(ctx.provider).toBe("github-actions");
    expect(ctx.prNumber).toBe(999);
    expect(ctx.token).toBe("ghp_override");
    expect(ctx.repository).toBe("override/repo");
  });

  it("should have a valid timestamp format", () => {
    const ctx = detectCIContext();
    expect(ctx.timestamp).toMatch(/^\d{8}T\d{6}$/);
  });
});
