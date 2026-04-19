import type { Notifier, NotificationContext, NotifyResult } from "@storywright/cli";
import { upsertPrComment } from "./comment.js";
import { resolveGitHubEnv } from "./env.js";
import { buildCommentMarkdown, buildErrorMarkdown } from "./markdown.js";

export interface GitHubNotifierOptions {
  token?: string;
  repository?: string;
  prNumber?: number;
  maxEntries?: number;
  collapseOnPass?: boolean;
  deleteOnPass?: boolean;
  reportUrl?: string;
  when?: "always" | "on-diff" | "on-error";
}

export function githubNotifier(options: GitHubNotifierOptions = {}): Notifier {
  return {
    name: "github",
    async notify(ctx: NotificationContext): Promise<NotifyResult> {
      const when = options.when ?? "always";

      if (when === "on-diff" && (!ctx.summary || ctx.summary.failed === 0)) {
        return { posted: false, skipped: "no diffs detected" };
      }
      if (when === "on-error" && ctx.exitCode < 2) {
        return { posted: false, skipped: "no execution error" };
      }

      const env = resolveGitHubEnv({
        token: options.token,
        repository: options.repository,
        prNumber: options.prNumber,
      });
      if (!env) {
        return {
          posted: false,
          skipped: "GitHub environment not detected (missing token, repository, or PR number)",
        };
      }

      const reportUrl = options.reportUrl ?? ctx.reportUrl;
      const deleteOnPass = options.deleteOnPass ?? false;

      let markdown: string;
      if (ctx.summary) {
        const allPassed =
          ctx.summary.failed === 0 && ctx.summary.entries.every((e) => e.type === "pass");
        markdown = buildCommentMarkdown(ctx.summary, {
          maxEntries: options.maxEntries ?? 10,
          collapseOnPass: options.collapseOnPass ?? true,
          deleteOnPass,
          reportUrl,
        });
        await upsertPrComment(env, markdown, { deleteOnPass, allPassed });
      } else {
        markdown = buildErrorMarkdown(ctx.exitCode, reportUrl);
        await upsertPrComment(env, markdown, { deleteOnPass: false, allPassed: false });
      }

      return { posted: true };
    },
  };
}

export { resolveGitHubEnv } from "./env.js";
export { buildCommentMarkdown, buildErrorMarkdown, MARKER } from "./markdown.js";
export type { GitHubEnv } from "./env.js";
export type { CommentOptions } from "./markdown.js";
