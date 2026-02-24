import type { Page } from '@playwright/test';

export interface StorywrightConfig {
	storybook: StorybookConfig;
	browsers: BrowserName[];
	browserOptions: Record<string, BrowserOption>;
	screenshot: ScreenshotConfig;
	diffDetection: DiffDetectionConfig;
	storage: StorageConfig;
	report: ReportConfig;
	workers: number | 'auto';
	timeout: TimeoutConfig;
	include: string[];
	exclude: string[];
	hooks: HooksConfig;
}

export type BrowserName = 'chromium' | 'firefox' | 'webkit' | (string & {});

export interface BrowserOption {
	viewport?: { width: number; height: number };
	deviceScaleFactor?: number;
	isMobile?: boolean;
	hasTouch?: boolean;
	userAgent?: string;
}

export interface StorybookConfig {
	staticDir: string;
	buildCommand: string;
	url?: string;
	compatibility: 'auto' | 'v7' | 'v8';
}

export interface ScreenshotConfig {
	fullPage: boolean;
	animations: 'disabled' | 'allow';
	threshold: number;
	maxDiffPixelRatio: number;
	freezeTime: string;
	timezone: string;
	locale: string;
	seed: number;
}

export interface DiffDetectionConfig {
	enabled: boolean;
	watchFiles: string[];
	baseBranch: string;
}

export interface StorageConfig {
	provider: 'local' | 's3';
	local: LocalStorageConfig;
	s3: S3StorageConfig;
}

export interface LocalStorageConfig {
	baselineDir: string;
}

export interface S3StorageConfig {
	bucket: string;
	prefix: string;
	region: string;
	compression: 'zstd' | 'gzip' | 'none';
}

export interface ReportConfig {
	outputDir: string;
	title: string;
}

export interface TimeoutConfig {
	test: number;
	navigation: number;
	expect: number;
}

export interface StoryContext {
	id: string;
	title: string;
	name: string;
}

export interface HooksConfig {
	beforeScreenshot?: (page: Page, story: StoryContext) => Promise<void>;
	afterScreenshot?: (page: Page, story: StoryContext) => Promise<void>;
}

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
