import { describe, expect, it } from 'vitest';
import type { TestSummary } from '../src/core/types.js';
import { formatSummary } from '../src/reporter/cli-reporter.js';

describe('formatSummary', () => {
	it('should format summary with no failures', () => {
		const summary: TestSummary = {
			total: 10,
			passed: 10,
			failed: 0,
			skipped: 0,
			duration: 5000,
			timestamp: '2024-01-01T00:00:00Z',
			browsers: ['chromium'],
			failures: [],
		};
		const output = formatSummary(summary);
		expect(output).toContain('Total: 10');
		expect(output).toContain('Passed: 10');
		expect(output).toContain('Failed: 0');
		expect(output).not.toContain('\u2717'); // no failure marker
	});

	it('should format summary with failures', () => {
		const summary: TestSummary = {
			total: 5,
			passed: 3,
			failed: 2,
			skipped: 0,
			duration: 154000,
			timestamp: '2024-01-01T00:00:00Z',
			browsers: ['chromium', 'webkit'],
			failures: [
				{
					story: 'Components/Button',
					variant: 'Primary',
					browser: 'chromium',
					diffRatio: 0.032,
					expected: 'expected.png',
					actual: 'actual.png',
					diff: 'diff.png',
				},
			],
		};
		const output = formatSummary(summary);
		expect(output).toContain('Failed: 2');
		expect(output).toContain('Components/Button: Primary (chromium)');
		expect(output).toContain('3.2%');
		expect(output).toContain('2m');
	});

	it('should use custom report path when provided', () => {
		const summary: TestSummary = {
			total: 1,
			passed: 1,
			failed: 0,
			skipped: 0,
			duration: 1000,
			timestamp: '2024-01-01T00:00:00Z',
			browsers: ['chromium'],
			failures: [],
		};
		const output = formatSummary(summary, {
			reportPath: '/custom/output/report/index.html',
		});
		expect(output).toContain('/custom/output/report/index.html');
		expect(output).not.toContain('.storywright/report/index.html');
	});

	it('should use default report path when not provided', () => {
		const summary: TestSummary = {
			total: 1,
			passed: 1,
			failed: 0,
			skipped: 0,
			duration: 1000,
			timestamp: '2024-01-01T00:00:00Z',
			browsers: ['chromium'],
			failures: [],
		};
		const output = formatSummary(summary);
		expect(output).toContain('.storywright/report/index.html');
	});
});
