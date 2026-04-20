export interface GitHubEnv {
  token: string;
  owner: string;
  repo: string;
  prNumber: number;
}

export interface GitHubEnvOptions {
  token?: string;
  repository?: string;
  prNumber?: number;
}

export function resolveGitHubEnv(options?: GitHubEnvOptions): GitHubEnv | null {
  const token = resolveToken(options);
  const repository = resolveRepository(options);
  const prNumber = resolvePrNumber(options);

  if (!token || !repository || !prNumber) {
    return null;
  }

  const [owner, repo] = repository.split("/");
  if (!owner || !repo) {
    return null;
  }

  return { token, owner, repo, prNumber };
}

function resolveToken(options?: GitHubEnvOptions): string | undefined {
  return options?.token ?? process.env.STORYWRIGHT_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
}

function resolveRepository(options?: GitHubEnvOptions): string | undefined {
  if (options?.repository) return options.repository;
  if (process.env.STORYWRIGHT_GITHUB_REPO) return process.env.STORYWRIGHT_GITHUB_REPO;
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;

  const user = process.env.CIRCLE_PROJECT_USERNAME;
  const repo = process.env.CIRCLE_PROJECT_REPONAME;
  if (user && repo) return `${user}/${repo}`;

  return undefined;
}

function resolvePrNumber(options?: GitHubEnvOptions): number | undefined {
  if (options?.prNumber) return options.prNumber;

  if (process.env.STORYWRIGHT_PR_NUMBER) {
    return Number(process.env.STORYWRIGHT_PR_NUMBER);
  }

  if (process.env.GITHUB_REF) {
    const match = process.env.GITHUB_REF.match(/^refs\/pull\/(\d+)\//);
    if (match) return Number(match[1]);
  }

  if (process.env.CIRCLE_PULL_REQUEST) {
    const match = process.env.CIRCLE_PULL_REQUEST.match(/\/pull\/(\d+)/);
    if (match) return Number(match[1]);
  }

  return undefined;
}
