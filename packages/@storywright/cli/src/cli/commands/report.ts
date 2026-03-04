import fs from 'node:fs/promises';
import path from 'node:path';
import { defineCommand } from 'citty';
import picomatch from 'picomatch';
import { loadConfig } from '../../config/index.js';
import type { TestSummary } from '../../core/types.js';
import { generateHtmlReport } from '../../playwright/reporter.js';
import { logger } from '../../utils/logger.js';

async function globFiles(pattern: string, cwd: string): Promise<string[]> {
	const matcher = picomatch(pattern);
	const results: string[] = [];

	async function walk(dir: string): Promise<void> {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			const relativePath = path.relative(cwd, fullPath).replace(/\\/g, '/');
			if (entry.isDirectory()) {
				await walk(fullPath);
			} else if (matcher(relativePath)) {
				results.push(fullPath);
			}
		}
	}

	await walk(cwd);
	return results;
}

export const reportCommand = defineCommand({
	meta: {
		name: 'report',
		description: 'Generate or open the report',
	},
	args: {
		open: {
			type: 'boolean',
			description: 'Open report in browser',
			default: false,
		},
		merge: {
			type: 'boolean',
			description: 'Merge multiple summary files',
			default: false,
		},
		from: {
			type: 'string',
			description: 'Glob pattern for summary files to merge',
		},
	},
	async run({ args }) {
		const config = await loadConfig();
		const reportDir = path.resolve(config.report.outputDir);

		if (args.merge && args.from) {
			logger.start('Merging reports...');
			const files = await globFiles(args.from, process.cwd());

			const merged: TestSummary = {
				total: 0,
				passed: 0,
				failed: 0,
				skipped: 0,
				duration: 0,
				timestamp: new Date().toISOString(),
				browsers: [],
				entries: [],
			};

			for (const file of files) {
				const content = await fs.readFile(file, 'utf-8');
				const summary: TestSummary = JSON.parse(content);
				merged.total += summary.total;
				merged.passed += summary.passed;
				merged.failed += summary.failed;
				merged.skipped += summary.skipped;
				merged.duration = Math.max(merged.duration, summary.duration);
				merged.browsers = [...new Set([...merged.browsers, ...summary.browsers])];
				merged.entries.push(...summary.entries);

				const shardAssetsDir = path.join(path.dirname(file), 'assets');
				const destAssetsDir = path.join(reportDir, 'assets');
				try {
					await fs.cp(shardAssetsDir, destAssetsDir, { recursive: true });
				} catch {
					// assets/ が存在しないシャード (全テスト pass) はスキップ
				}
			}

			await fs.mkdir(reportDir, { recursive: true });
			await fs.writeFile(path.join(reportDir, 'summary.json'), JSON.stringify(merged, null, 2));

			const html = generateHtmlReport(merged);
			await fs.writeFile(path.join(reportDir, 'index.html'), html);
			logger.success(`Merged ${files.length} reports → index.html generated`);
		}

		if (args.open) {
			const reportPath = path.join(reportDir, 'index.html');
			const { exec: execCb } = await import('node:child_process');
			const platform = process.platform;
			const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
			execCb(`${cmd} ${reportPath}`);
			logger.success('Report opened');
		}
	},
});
