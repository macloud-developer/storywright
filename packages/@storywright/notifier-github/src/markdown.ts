import type { TestSummary } from "@storywright/cli";

const MARKER = "<!-- storywright-report -->";
const MAX_COMMENT_LENGTH = 65_536;
const SAFE_LIMIT = Math.floor(MAX_COMMENT_LENGTH * 0.9);

export { MARKER };

export interface CommentOptions {
  maxEntries: number;
  collapseOnPass: boolean;
  deleteOnPass: boolean;
  reportUrl?: string;
}

export function buildCommentMarkdown(summary: TestSummary, options: CommentOptions): string {
  let md = buildFull(summary, options, options.maxEntries);

  if (md.length > SAFE_LIMIT) {
    md = buildFull(summary, options, 5);
    if (md.length > SAFE_LIMIT) {
      md = buildFull(summary, options, 0);
    }
  }

  return md;
}

function buildFull(summary: TestSummary, options: CommentOptions, maxEntries: number): string {
  const { total, passed, failed, skipped, duration, browsers, entries } = summary;
  const diffEntries = entries.filter((e) => e.type === "diff");
  const newEntries = entries.filter((e) => e.type === "new");
  const hasDiff = diffEntries.length > 0 || newEntries.length > 0;

  const status = hasDiff
    ? `${diffEntries.length + newEntries.length}件のビジュアル差分を検出`
    : "All passed";

  let md = "## Storywright Visual Regression Report\n\n";
  md += `**Status:** ${status}\n\n`;

  md += "| 項目 | 件数 |\n|------|------|\n";
  md += `| Total | ${total} |\n`;
  md += `| Passed | ${passed} |\n`;
  if (newEntries.length > 0) md += `| New | ${newEntries.length} |\n`;
  if (failed > 0) md += `| Failed | ${failed} |\n`;
  if (skipped > 0) md += `| Skipped | ${skipped} |\n`;
  md += "\n";

  md += `**Browsers:** ${browsers.join(", ")}`;
  md += ` | **Duration:** ${formatDuration(duration)}\n\n`;

  if (diffEntries.length > 0 && maxEntries > 0) {
    const visible = diffEntries.slice(0, maxEntries);
    const rest = diffEntries.slice(maxEntries);

    md += "### 差分一覧\n\n";
    md += "| Story | Browser | Diff |\n|-------|---------|------|\n";
    for (const e of visible) {
      md += `| ${e.story}: ${e.variant} | ${e.browser} | ${(e.diffRatio * 100).toFixed(1)}% |\n`;
    }

    if (rest.length > 0) {
      md += `\n<details>\n<summary>他${rest.length}件</summary>\n\n`;
      md += "| Story | Browser | Diff |\n|-------|---------|------|\n";
      for (const e of rest) {
        md += `| ${e.story}: ${e.variant} | ${e.browser} | ${(e.diffRatio * 100).toFixed(1)}% |\n`;
      }
      md += "\n</details>\n";
    }
    md += "\n";
  } else if (diffEntries.length > 0 && maxEntries === 0) {
    md += `> 差分が多いため一覧を省略しています（${diffEntries.length}件）。レポートをご確認ください。\n\n`;
  }

  if (options.reportUrl) {
    md += `[レポートを開く](${options.reportUrl})\n\n`;
  }

  md += `${MARKER}\n`;
  return md;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}
