import fs from "node:fs/promises";
import path from "node:path";
import { defineCommand } from "citty";
import { loadConfig } from "../../config/index.js";
import type { TestSummary } from "../../core/types.js";
import { detectCIContext } from "../../notifier/ci-context.js";
import { resolveReportUrl } from "../../notifier/report-url.js";
import { logger } from "../../utils/logger.js";

export const notifyCommand = defineCommand({
  meta: {
    name: "notify",
    description: "Send test results to notification services",
  },
  subCommands: {
    github: defineCommand({
      meta: {
        name: "github",
        description: "Post test results as a GitHub PR comment",
      },
      args: {
        token: {
          type: "string",
          description: "GitHub token",
        },
        repo: {
          type: "string",
          description: "Repository (owner/repo)",
        },
        pr: {
          type: "string",
          description: "PR number",
        },
        "report-url": {
          type: "string",
          description: "Report URL (overrides config template)",
        },
        from: {
          type: "string",
          description: "Path to summary.json",
          default: ".storywright/report/summary.json",
        },
        "dry-run": {
          type: "boolean",
          description: "Print markdown without posting",
          default: false,
        },
        "max-entries": {
          type: "string",
          description: "Max diff entries to show",
          default: "10",
        },
        when: {
          type: "string",
          description: "Condition: always|on-diff|on-error",
          default: "always",
        },
        "exit-code": {
          type: "string",
          description: "Exit code from test run (0=pass, 1=diff, 2=error)",
        },
      },
      async run({ args }) {
        const summaryPath = path.resolve(args.from);
        let summary: TestSummary | undefined;
        try {
          const content = await fs.readFile(summaryPath, "utf-8");
          summary = JSON.parse(content);
        } catch {
          // summary.json is not available — still proceed for on-error notifications
          logger.warn(`Could not read summary: ${summaryPath}`);
        }

        // Resolve report URL
        let reportUrl = args["report-url"];
        if (!reportUrl) {
          try {
            const config = await loadConfig();
            if (config.report.url) {
              const ciCtx = detectCIContext({
                prNumber: args.pr ? Number(args.pr) : undefined,
                repository: args.repo,
                token: args.token,
              });
              reportUrl = resolveReportUrl(config.report.url, ciCtx);
            }
          } catch {
            // Config not found — report URL will be omitted
          }
        }

        // Dynamically import notifier-github
        let githubModule: typeof import("@storywright/notifier-github");
        try {
          githubModule = await import("@storywright/notifier-github");
        } catch {
          logger.error(
            "GitHub notifier requires the @storywright/notifier-github package.\n" +
              "Install it with: pnpm add -D @storywright/notifier-github",
          );
          process.exitCode = 2;
          return;
        }

        const maxEntries = Number(args["max-entries"]) || 10;

        if (args["dry-run"]) {
          if (summary) {
            const md = githubModule.buildCommentMarkdown(summary, {
              maxEntries,
              collapseOnPass: true,
              deleteOnPass: false,
              reportUrl,
            });
            process.stdout.write(md);
          } else {
            const exitCode = args["exit-code"] != null ? Number(args["exit-code"]) : 2;
            const md = githubModule.buildErrorMarkdown(exitCode, reportUrl);
            process.stdout.write(md);
          }
          return;
        }

        const exitCode =
          args["exit-code"] != null
            ? Number(args["exit-code"])
            : summary
              ? summary.failed > 0
                ? 1
                : 0
              : 2;

        const notifier = githubModule.githubNotifier({
          token: args.token,
          repository: args.repo,
          prNumber: args.pr ? Number(args.pr) : undefined,
          maxEntries,
          when: args.when as "always" | "on-diff" | "on-error",
          reportUrl,
        });

        const result = await notifier.notify({
          summary,
          exitCode,
          reportDir: path.dirname(summaryPath),
          reportUrl,
          config: {} as never,
        });

        if (result.posted) {
          logger.success("GitHub PR comment posted");
        } else if (result.skipped) {
          logger.info(`GitHub PR comment skipped: ${result.skipped}`);
        }
      },
    }),
  },
});
