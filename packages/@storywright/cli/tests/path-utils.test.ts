import { describe, expect, it } from 'vitest';
import { normalizePath, stripLeadingDotSlash } from '../src/utils/path.js';

describe('normalizePath', () => {
	it('should add ./ prefix if missing', () => {
		expect(normalizePath('src/Button.tsx')).toBe('./src/Button.tsx');
	});

	it('should keep ./ prefix if present', () => {
		expect(normalizePath('./src/Button.tsx')).toBe('./src/Button.tsx');
	});

	it('should convert backslashes to forward slashes', () => {
		expect(normalizePath('src\\Button.tsx')).toBe('./src/Button.tsx');
	});
});

describe('stripLeadingDotSlash', () => {
	it('should remove ./ prefix', () => {
		expect(stripLeadingDotSlash('./src/Button.tsx')).toBe('src/Button.tsx');
	});

	it('should leave paths without ./ unchanged', () => {
		expect(stripLeadingDotSlash('src/Button.tsx')).toBe('src/Button.tsx');
	});
});
