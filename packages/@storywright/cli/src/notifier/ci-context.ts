import { execSync } from "node:child_process";

export interface CIContext {
  provider: "github-actions" | "circleci" | "generic" | "local";
  prNumber?: number;
  branch: string;
  sha: string;
  shortSha: string;
  timestamp: string;
  repository?: string;
  token?: string;
}

export interface CIContextOverrides {
  prNumber?: number;
  branch?: string;
  sha?: string;
  repository?: string;
  token?: string;
}

export function detectCIContext(overrides?: CIContextOverrides): CIContext {
  const base = detectFromEnvironment();

  const sha = overrides?.sha ?? base.sha;
  return {
    ...base,
    ...stripUndefined(overrides),
    sha,
    shortSha: sha.slice(0, 7),
  };
}

function detectFromEnvironment(): CIContext {
  const timestamp = formatTimestamp(new Date());

  if (process.env.GITHUB_ACTIONS) {
    return {
      provider: "github-actions",
      token: process.env.GITHUB_TOKEN,
      repository: process.env.GITHUB_REPOSITORY,
      prNumber: extractPrFromGitHubRef(process.env.GITHUB_REF),
      branch: process.env.GITHUB_HEAD_REF || gitBranch(),
      sha: process.env.GITHUB_SHA || gitSha(),
      shortSha: (process.env.GITHUB_SHA || gitSha()).slice(0, 7),
      timestamp,
    };
  }

  if (process.env.CIRCLECI) {
    return {
      provider: "circleci",
      token: process.env.GITHUB_TOKEN,
      repository: buildCircleCIRepository(),
      prNumber: extractPrFromUrl(process.env.CIRCLE_PULL_REQUEST),
      branch: process.env.CIRCLE_BRANCH || gitBranch(),
      sha: process.env.CIRCLE_SHA1 || gitSha(),
      shortSha: (process.env.CIRCLE_SHA1 || gitSha()).slice(0, 7),
      timestamp,
    };
  }

  if (process.env.STORYWRIGHT_PR_NUMBER) {
    return {
      provider: "generic",
      token: process.env.STORYWRIGHT_GITHUB_TOKEN,
      repository: process.env.STORYWRIGHT_GITHUB_REPO,
      prNumber: Number(process.env.STORYWRIGHT_PR_NUMBER),
      branch: gitBranch(),
      sha: gitSha(),
      shortSha: gitSha().slice(0, 7),
      timestamp,
    };
  }

  return {
    provider: "local",
    branch: gitBranch(),
    sha: gitSha(),
    shortSha: gitSha().slice(0, 7),
    timestamp,
  };
}

export function extractPrFromGitHubRef(ref?: string): number | undefined {
  if (!ref) return undefined;
  const match = ref.match(/^refs\/pull\/(\d+)\//);
  return match ? Number(match[1]) : undefined;
}

export function extractPrFromUrl(url?: string): number | undefined {
  if (!url) return undefined;
  const match = url.match(/\/pull\/(\d+)/);
  return match ? Number(match[1]) : undefined;
}

function buildCircleCIRepository(): string | undefined {
  const user = process.env.CIRCLE_PROJECT_USERNAME;
  const repo = process.env.CIRCLE_PROJECT_REPONAME;
  return user && repo ? `${user}/${repo}` : undefined;
}

function gitBranch(): string {
  try {
    return execSync("git branch --show-current", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

function gitSha(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "0000000000000000000000000000000000000000";
  }
}

function formatTimestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "");
}

function stripUndefined(obj?: CIContextOverrides): Partial<CIContext> {
  if (!obj) return {};
  const result: Partial<CIContext> = {};
  if (obj.prNumber !== undefined) result.prNumber = obj.prNumber;
  if (obj.branch !== undefined) result.branch = obj.branch;
  if (obj.sha !== undefined) result.sha = obj.sha;
  if (obj.repository !== undefined) result.repository = obj.repository;
  if (obj.token !== undefined) result.token = obj.token;
  return result;
}
