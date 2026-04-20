import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { resolveGitHubEnv } from "../src/env.js";

describe("resolveGitHubEnv", () => {
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
  });

  it("should resolve from GitHub Actions env vars", () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    process.env.GITHUB_REPOSITORY = "owner/repo";
    process.env.GITHUB_REF = "refs/pull/42/merge";

    const env = resolveGitHubEnv();
    expect(env).toEqual({ token: "ghp_test", owner: "owner", repo: "repo", prNumber: 42 });
  });

  it("should resolve from CircleCI env vars", () => {
    process.env.GITHUB_TOKEN = "ghp_circle";
    process.env.CIRCLE_PULL_REQUEST = "https://github.com/org/project/pull/99";
    process.env.CIRCLE_PROJECT_USERNAME = "org";
    process.env.CIRCLE_PROJECT_REPONAME = "project";

    const env = resolveGitHubEnv();
    expect(env).toEqual({ token: "ghp_circle", owner: "org", repo: "project", prNumber: 99 });
  });

  it("should resolve from STORYWRIGHT_* env vars", () => {
    process.env.STORYWRIGHT_GITHUB_TOKEN = "ghp_sw";
    process.env.STORYWRIGHT_GITHUB_REPO = "my/repo";
    process.env.STORYWRIGHT_PR_NUMBER = "77";

    const env = resolveGitHubEnv();
    expect(env).toEqual({ token: "ghp_sw", owner: "my", repo: "repo", prNumber: 77 });
  });

  it("should prefer options over env vars", () => {
    process.env.GITHUB_TOKEN = "ghp_env";
    process.env.GITHUB_REPOSITORY = "env/repo";
    process.env.GITHUB_REF = "refs/pull/1/merge";

    const env = resolveGitHubEnv({
      token: "ghp_opt",
      repository: "opt/repo",
      prNumber: 999,
    });
    expect(env).toEqual({ token: "ghp_opt", owner: "opt", repo: "repo", prNumber: 999 });
  });

  it("should return null when token is missing", () => {
    process.env.GITHUB_REPOSITORY = "owner/repo";
    process.env.GITHUB_REF = "refs/pull/1/merge";

    expect(resolveGitHubEnv()).toBeNull();
  });

  it("should return null when repository is missing", () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    process.env.GITHUB_REF = "refs/pull/1/merge";

    expect(resolveGitHubEnv()).toBeNull();
  });

  it("should return null when PR number is missing", () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    process.env.GITHUB_REPOSITORY = "owner/repo";
    process.env.GITHUB_REF = "refs/heads/main";

    expect(resolveGitHubEnv()).toBeNull();
  });

  it("should return null when repository format is invalid", () => {
    process.env.GITHUB_TOKEN = "ghp_test";
    process.env.GITHUB_REF = "refs/pull/1/merge";

    expect(resolveGitHubEnv({ repository: "invalid" })).toBeNull();
  });
});
