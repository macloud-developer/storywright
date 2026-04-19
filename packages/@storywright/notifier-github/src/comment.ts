import { githubApi } from "./api.js";
import type { GitHubEnv } from "./env.js";
import { MARKER } from "./markdown.js";

interface Comment {
  id: number;
  body: string;
}

export async function upsertPrComment(
  env: GitHubEnv,
  markdown: string,
  options: { deleteOnPass?: boolean; allPassed?: boolean },
): Promise<void> {
  const existing = await findMarkerComment(env);

  if (options.deleteOnPass && options.allPassed) {
    if (existing) {
      await githubApi("DELETE", `/repos/${env.owner}/${env.repo}/issues/comments/${existing.id}`, {
        token: env.token,
      });
    }
    return;
  }

  if (existing) {
    await githubApi("PATCH", `/repos/${env.owner}/${env.repo}/issues/comments/${existing.id}`, {
      token: env.token,
      body: { body: markdown },
    });
  } else {
    await githubApi("POST", `/repos/${env.owner}/${env.repo}/issues/${env.prNumber}/comments`, {
      token: env.token,
      body: { body: markdown },
    });
  }
}

async function findMarkerComment(env: GitHubEnv): Promise<Comment | null> {
  let page = 1;
  const perPage = 100;

  while (true) {
    const comments = (await githubApi(
      "GET",
      `/repos/${env.owner}/${env.repo}/issues/${env.prNumber}/comments?per_page=${perPage}&page=${page}`,
      { token: env.token },
    )) as Comment[];

    const found = comments.find((c) => c.body.includes(MARKER));
    if (found) return found;

    if (comments.length < perPage) break;
    page++;
  }

  return null;
}
