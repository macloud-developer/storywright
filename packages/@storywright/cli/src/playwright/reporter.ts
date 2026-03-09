import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type {
	FullConfig,
	FullResult,
	TestResult as PwTestResult,
	Reporter,
	Suite,
	TestCase,
} from '@playwright/test/reporter';
import type { TestEntry, TestSummary } from '../core/types.js';

interface StorywrightReporterOptions {
	outputDir?: string;
}

class StorywrightReporter implements Reporter {
	private outputDir: string;
	private results = new Map<
		string,
		{
			title: string;
			project: string;
			status: 'passed' | 'failed' | 'skipped';
			duration: number;
			attachments: { name: string; path?: string; contentType: string }[];
		}
	>();
	private startTime = 0;

	constructor(options: StorywrightReporterOptions = {}) {
		this.outputDir = options.outputDir || path.resolve('.storywright', 'report');
	}

	onBegin(_config: FullConfig, _suite: Suite): void {
		this.startTime = Date.now();
	}

	onTestEnd(test: TestCase, result: PwTestResult): void {
		const project = test.parent?.project()?.name ?? 'unknown';
		const key = `${test.title}::${project}`;
		const status =
			result.status === 'passed' ? 'passed' : result.status === 'skipped' ? 'skipped' : 'failed';

		// Overwrite previous attempts so only the final retry result is kept
		this.results.set(key, {
			title: test.title,
			project,
			status,
			duration: result.duration,
			attachments: result.attachments.map((a) => ({
				name: a.name,
				path: a.path,
				contentType: a.contentType,
			})),
		});
	}

	async onEnd(_result: FullResult): Promise<void> {
		const duration = Date.now() - this.startTime;
		const allResults = [...this.results.values()];
		const passed = allResults.filter((r) => r.status === 'passed').length;
		const failed = allResults.filter((r) => r.status === 'failed').length;
		const skipped = allResults.filter((r) => r.status === 'skipped').length;

		const browsers = [...new Set(allResults.map((r) => r.project))];
		const entries: TestEntry[] = [];

		// Collect failure images
		const assetsDir = path.join(this.outputDir, 'assets');
		for (const dir of ['expected', 'actual', 'diff']) {
			fs.mkdirSync(path.join(assetsDir, dir), { recursive: true });
		}

		for (const testResult of allResults) {
			if (testResult.status === 'skipped') continue;

			const titleParts = testResult.title.split(': ');
			const storyTitle = titleParts[0] ?? testResult.title;
			const variant = titleParts.slice(1).join(': ') || 'default';

			if (testResult.status === 'passed') {
				entries.push({
					type: 'pass',
					story: storyTitle,
					variant,
					browser: testResult.project,
					diffRatio: 0,
					expected: '',
					actual: '',
					diff: '',
				});
				continue;
			}

			const sanitizedName = testResult.title.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

			const imageAttachments = testResult.attachments.filter(
				(a) => a.path && a.contentType.startsWith('image/'),
			);
			const hasDiff = imageAttachments.some((a) => a.name.includes('diff'));

			const entry: TestEntry = {
				type: hasDiff ? 'diff' : 'new',
				story: storyTitle,
				variant,
				browser: testResult.project,
				diffRatio: 0,
				expected: '',
				actual: '',
				diff: '',
			};

			for (const attachment of testResult.attachments) {
				if (!attachment.path) continue;
				const ext = path.extname(attachment.path);
				const destName = `${sanitizedName}-${testResult.project}${ext}`;

				if (attachment.name.includes('expected')) {
					const dest = path.join(assetsDir, 'expected', destName);
					copyFileIfExists(attachment.path, dest);
					entry.expected = `assets/expected/${destName}`;
				} else if (attachment.name.includes('actual')) {
					const dest = path.join(assetsDir, 'actual', destName);
					copyFileIfExists(attachment.path, dest);
					entry.actual = `assets/actual/${destName}`;
				} else if (attachment.name.includes('diff')) {
					const dest = path.join(assetsDir, 'diff', destName);
					copyFileIfExists(attachment.path, dest);
					entry.diff = `assets/diff/${destName}`;
				}
			}

			entries.push(entry);
		}

		const summary: TestSummary = {
			total: allResults.length,
			passed,
			failed,
			skipped,
			duration,
			timestamp: new Date().toISOString(),
			browsers,
			entries,
		};

		fs.mkdirSync(this.outputDir, { recursive: true });
		fs.writeFileSync(path.join(this.outputDir, 'summary.json'), JSON.stringify(summary, null, 2));

		// Generate HTML report
		const html = generateHtmlReport(summary);
		fs.writeFileSync(path.join(this.outputDir, 'index.html'), html);
	}
}

function copyFileIfExists(src: string, dest: string): void {
	try {
		fs.copyFileSync(src, dest);
	} catch {
		// source may not exist
	}
}

export function generateHtmlReport(summary: TestSummary): string {
	const require = createRequire(import.meta.url);
	const bundlePath = require.resolve('@storywright/report');
	const bundleJs = fs.readFileSync(bundlePath, 'utf-8');

	// Load CSS if it exists as a separate file
	const bundleDir = path.dirname(bundlePath);
	const assetsDir = path.join(bundleDir, 'assets');
	let cssContent = '';
	if (fs.existsSync(assetsDir)) {
		const cssFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.css'));
		for (const cssFile of cssFiles) {
			cssContent += fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');
		}
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Storywright Report</title>
<link rel="icon" type="image/x-icon" href="data:image/x-icon;base64,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">
${cssContent ? `<style>${cssContent}</style>` : ''}
</head>
<body>
<div id="app"></div>
<script>window.__STORYWRIGHT_SUMMARY__ = ${JSON.stringify(summary).replace(/</g, '\\u003c')};</script>
<script>${bundleJs}</script>
</body>
</html>`;
}

export default StorywrightReporter;
