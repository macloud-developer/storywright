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
<link rel="icon" type="image/png" href="data:image/png;base64,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">
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
