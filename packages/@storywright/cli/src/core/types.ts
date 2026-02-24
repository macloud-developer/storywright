export interface Story {
	id: string;
	title: string;
	name: string;
	importPath: string;
	tags?: string[];
	type: 'story' | 'docs';
}

export interface StoryIndex {
	v: number;
	entries: Record<string, Story>;
}

export interface StatsModule {
	id: string;
	name: string;
	reasons: { moduleName: string }[];
}

export interface StatsIndex {
	modules: StatsModule[];
}

export interface TestResult {
	story: Story;
	browser: string;
	status: 'passed' | 'failed' | 'skipped';
	duration: number;
	diffRatio?: number;
	expectedPath?: string;
	actualPath?: string;
	diffPath?: string;
	error?: string;
}

export interface TestSummary {
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
