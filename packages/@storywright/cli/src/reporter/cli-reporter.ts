import type { TestSummary } from '../core/types.js';

export function formatSummary(summary: TestSummary, options?: { reportPath?: string }): string {
	const durationSec = Math.round(summary.duration / 1000);
	const minutes = Math.floor(durationSec / 60);
	const seconds = durationSec % 60;
	const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

	const lines: string[] = [
		'',
		'Storywright Results',
		'\u2550'.repeat(42),
		`  Total: ${summary.total}  Passed: ${summary.passed}  Failed: ${summary.failed}  Skipped: ${summary.skipped}`,
		`  Duration: ${durationStr}`,
		`  Browsers: ${summary.browsers.join(', ')}`,
	];

	const newFailures = summary.failures.filter((f) => f.type === 'new');
	const diffFailures = summary.failures.filter((f) => f.type !== 'new');

	if (newFailures.length > 0) {
		lines.push('');
		lines.push('  New (no baseline):');
		for (const failure of newFailures) {
			lines.push(`  \u25cb ${failure.story}: ${failure.variant} (${failure.browser})`);
		}
	}

	if (diffFailures.length > 0) {
		lines.push('');
		lines.push('  Failed:');
		for (const failure of diffFailures) {
			lines.push(`  \u2717 ${failure.story}: ${failure.variant} (${failure.browser})`);
			if (failure.diffRatio > 0) {
				const pct = (failure.diffRatio * 100).toFixed(1);
				lines.push(`    \u2192 Diff: ${pct}% pixels changed`);
			}
		}
	}

	const reportPath = options?.reportPath ?? '.storywright/report/index.html';
	lines.push('');
	lines.push(`  Report: ${reportPath}`);
	lines.push('\u2550'.repeat(42));
	lines.push('');

	return lines.join('\n');
}
