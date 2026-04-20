export interface ReportUrlContext {
  prNumber?: number;
  branch: string;
  sha: string;
  shortSha: string;
  timestamp: string;
}

export function resolveReportUrl(template: string, ctx: ReportUrlContext): string {
  return template
    .replace(/\$\{prNumber\}/g, ctx.prNumber != null ? String(ctx.prNumber) : "")
    .replace(/\$\{branch\}/g, encodeURIComponent(ctx.branch))
    .replace(/\$\{sha\}/g, ctx.sha)
    .replace(/\$\{shortSha\}/g, ctx.shortSha)
    .replace(/\$\{timestamp\}/g, ctx.timestamp);
}
