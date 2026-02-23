import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';

describe('DEFAULT_CONFIG', () => {
	it('should have expected default values', () => {
		expect(DEFAULT_CONFIG.browsers).toEqual(['chromium']);
		expect(DEFAULT_CONFIG.screenshot.threshold).toBe(0.02);
		expect(DEFAULT_CONFIG.screenshot.maxDiffPixelRatio).toBe(0.02);
		expect(DEFAULT_CONFIG.screenshot.fullPage).toBe(true);
		expect(DEFAULT_CONFIG.screenshot.animations).toBe('disabled');
		expect(DEFAULT_CONFIG.screenshot.freezeTime).toBe('2024-01-01T00:00:00');
		expect(DEFAULT_CONFIG.storage.provider).toBe('local');
		expect(DEFAULT_CONFIG.storage.local.baselineDir).toBe('.storywright/baselines');
		expect(DEFAULT_CONFIG.workers).toBe('auto');
		expect(DEFAULT_CONFIG.diffDetection.enabled).toBe(true);
		expect(DEFAULT_CONFIG.diffDetection.baseBranch).toBe('main');
	});
});
