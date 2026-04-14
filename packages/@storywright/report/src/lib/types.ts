export interface ReportSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  timestamp: string;
  browsers: string[];
  entries: TestEntry[];
}

export interface TestEntry {
  type: "diff" | "new" | "pass";
  story: string;
  variant: string;
  browser: string;
  diffRatio: number;
  expected: string;
  actual: string;
  diff: string;
}

export type TypeFilter = "all" | "diff" | "new" | "pass";

export type ImageTab = "expected" | "actual" | "diff" | "slide";

export function entryKey(f: TestEntry): string {
  return `${f.story}::${f.variant}::${f.browser}`;
}
