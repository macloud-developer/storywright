/**
 * Ambient declaration for @storywright/notifier-github, an optional peer
 * resolved at runtime via dynamic import. It cannot be a workspace dependency
 * of this package because notifier-github itself depends on @storywright/cli,
 * which would create a build-order cycle. Keep in sync with
 * packages/@storywright/notifier-github/src.
 */
declare module "@storywright/notifier-github" {
  import type { TestSummary } from "../core/types.js";
  import type { Notifier } from "./types.js";

  export interface CommentOptions {
    maxEntries: number;
    collapseOnPass: boolean;
    deleteOnPass: boolean;
    reportUrl?: string;
  }

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

  export function buildCommentMarkdown(summary: TestSummary, options: CommentOptions): string;
  export function buildErrorMarkdown(exitCode: number, reportUrl?: string): string;
  export function githubNotifier(options?: GitHubNotifierOptions): Notifier;
}
