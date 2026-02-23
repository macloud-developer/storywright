export interface ReportSummary {
	total: number;
	passed: number;
	failed: number;
	skipped: number;
	duration: number;
	timestamp: string;
	browsers: string[];
	failures: FailureEntry[];
}

export interface FailureEntry {
	type: 'diff' | 'new';
	story: string;
	variant: string;
	browser: string;
	diffRatio: number;
	expected: string;
	actual: string;
	diff: string;
}

export type TypeFilter = 'all' | 'diff' | 'new';

export function failureKey(f: FailureEntry): string {
	return `${f.story}::${f.variant}::${f.browser}`;
}
