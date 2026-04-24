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

  const diffAndNew = diffEntries.length + newEntries.length;
  const status = hasDiff
    ? `🔴 **Status:** ${diffAndNew} visual ${diffAndNew === 1 ? "diff" : "diffs"} detected`
    : "✅ **Status:** All passed";

  const collapse = options.collapseOnPass && !hasDiff;

  let md = "## 📸 Storywright Visual Regression Report\n\n";
  md += `${status}\n\n`;

  if (collapse) {
    md += `<details>\n<summary>Details</summary>\n\n`;
  }

  md += "| Metric | Count |\n|--------|-------|\n";
  md += `| 📋 Total | ${total} |\n`;
  md += `| ✅ Passed | ${passed} |\n`;
  if (newEntries.length > 0) md += `| ✨ New | ${newEntries.length} |\n`;
  if (failed > 0) md += `| ❌ Failed | ${failed} |\n`;
  if (skipped > 0) md += `| ⏭️ Skipped | ${skipped} |\n`;
  md += "\n";

  md += `🌐 **Browsers:** ${browsers.join(", ")}`;
  md += ` | ⏱️ **Duration:** ${formatDuration(duration)}\n\n`;

  if (diffEntries.length > 0 && maxEntries > 0) {
    const visible = diffEntries.slice(0, maxEntries);
    const rest = diffEntries.slice(maxEntries);

    md += "### 🔍 Differences\n\n";
    md += "| Story | Browser |\n|-------|---------|\n";
    for (const e of visible) {
      md += `| ${e.story}: ${e.variant} | ${e.browser} |\n`;
    }

    if (rest.length > 0) {
      md += `\n<details>\n<summary>${rest.length} more</summary>\n\n`;
      md += "| Story | Browser |\n|-------|---------|\n";
      for (const e of rest) {
        md += `| ${e.story}: ${e.variant} | ${e.browser} |\n`;
      }
      md += "\n</details>\n";
    }
    md += "\n";
  } else if (diffEntries.length > 0 && maxEntries === 0) {
    md += `> ${diffEntries.length} diffs omitted for brevity. See the report for details.\n\n`;
  }

  if (options.reportUrl) {
    md += `🔗 [Open report](${options.reportUrl})\n\n`;
  }

  if (collapse) {
    md += "</details>\n\n";
  }

  md += `${MARKER}\n`;
  return md;
}

export function buildErrorMarkdown(exitCode: number, reportUrl?: string): string {
  let md = "## 📸 Storywright Visual Regression Report\n\n";
  md += `💥 **Status:** Execution error (exit code ${exitCode})\n\n`;
  md += "> Test execution failed before results could be collected.\n\n";

  if (reportUrl) {
    md += `🔗 [Open report](${reportUrl})\n\n`;
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
