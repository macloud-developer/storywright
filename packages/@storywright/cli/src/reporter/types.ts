import type { TestResult, TestSummary } from '../core/types.js';

export interface ReportData {
	summary: TestSummary;
	results: TestResult[];
}
