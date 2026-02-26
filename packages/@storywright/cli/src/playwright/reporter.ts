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
import type { FailureEntry, TestSummary } from '../core/types.js';

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
		const failures: FailureEntry[] = [];

		// Collect failure images
		const assetsDir = path.join(this.outputDir, 'assets');
		for (const dir of ['expected', 'actual', 'diff']) {
			fs.mkdirSync(path.join(assetsDir, dir), { recursive: true });
		}

		for (const testResult of allResults) {
			if (testResult.status !== 'failed') continue;

			const titleParts = testResult.title.split(': ');
			const storyTitle = titleParts[0] ?? testResult.title;
			const variant = titleParts.slice(1).join(': ') || 'default';
			const sanitizedName = testResult.title.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

			const imageAttachments = testResult.attachments.filter(
				(a) => a.path && a.contentType.startsWith('image/'),
			);
			const hasDiff = imageAttachments.some((a) => a.name.includes('diff'));

			const failure: FailureEntry = {
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
					failure.expected = `assets/expected/${destName}`;
				} else if (attachment.name.includes('actual')) {
					const dest = path.join(assetsDir, 'actual', destName);
					copyFileIfExists(attachment.path, dest);
					failure.actual = `assets/actual/${destName}`;
				} else if (attachment.name.includes('diff')) {
					const dest = path.join(assetsDir, 'diff', destName);
					copyFileIfExists(attachment.path, dest);
					failure.diff = `assets/diff/${destName}`;
				}
			}

			failures.push(failure);
		}

		const summary: TestSummary = {
			total: allResults.length,
			passed,
			failed,
			skipped,
			duration,
			timestamp: new Date().toISOString(),
			browsers,
			failures,
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
