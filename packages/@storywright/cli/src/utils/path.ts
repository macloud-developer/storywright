import path from 'node:path';

export function normalizePath(filePath: string): string {
	const normalized = filePath.replace(/\\/g, '/');
	if (normalized.startsWith('./')) {
		return normalized;
	}
	return `./${normalized}`;
}

export function stripLeadingDotSlash(filePath: string): string {
	return filePath.replace(/^\.\//, '');
}

export function resolveOutputDir(outputDir: string, ...segments: string[]): string {
	return path.resolve(outputDir, ...segments);
}
