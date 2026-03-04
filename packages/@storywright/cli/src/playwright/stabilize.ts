/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import type { Page } from '@playwright/test';

export interface StabilizeOptions {
	freezeTime: string;
	seed: number;
	disableAnimations: boolean;
}

/**
 * Pre-navigation page setup for reproducible screenshots.
 * Must be called BEFORE page.goto().
 */
export async function initPage(page: Page, options: StabilizeOptions): Promise<void> {
	await page.clock.install({ time: new Date(options.freezeTime) });

	await page.addInitScript((seed: number) => {
		let s = seed;
		Math.random = () => {
			s = (s * 16807 + 0) % 2147483647;
			return (s - 1) / 2147483646;
		};
	}, options.seed);
}

/**
 * Post-navigation page stabilization for reproducible screenshots.
 * Must be called AFTER page.goto() has resolved.
 */
export async function stabilizePage(page: Page, options: StabilizeOptions): Promise<void> {
	if (options.disableAnimations) {
		await page.addStyleTag({
			content:
				'*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }',
		});
	}

	// Wait for story to render: content inside #storybook-root OR portal content on body
	await page.waitForFunction(
		() => {
			const root = document.getElementById('storybook-root');
			if (!root) return false;
			if (root.childElementCount > 0) return true;
			for (const el of document.body.children) {
				if (el.tagName === 'SCRIPT' || el.id === 'storybook-root' || el.id === 'storybook-docs')
					continue;
				return true;
			}
			return false;
		},
		{ timeout: 10000 },
	);

	// Wait for web fonts to finish loading
	await page.waitForFunction(() => document.fonts.ready);

	// Allow async renders to settle (multiple animation frames)
	// This must run BEFORE image checks so the framework has finished adding
	// all <img> elements to the DOM
	await page.waitForFunction(
		() =>
			new Promise((resolve) => {
				let count = 0;
				const tick = () => {
					if (++count >= 3) return resolve(true);
					requestAnimationFrame(tick);
				};
				requestAnimationFrame(tick);
			}),
	);

	// Force lazy-loaded images to eager and wait for load
	await page.evaluate(async () => {
		const lazyImages = document.querySelectorAll('img[loading="lazy"]');
		for (const img of lazyImages) {
			(img as HTMLImageElement).loading = 'eager';
		}

		const images = Array.from(document.images).filter((img) => !img.complete);
		await Promise.all(
			images.map(
				(img) =>
					new Promise<void>((resolve) => {
						const timeout = setTimeout(resolve, 5000);
						img.onload = img.onerror = () => {
							clearTimeout(timeout);
							resolve();
						};
					}),
			),
		);
	});

	if (options.disableAnimations) {
		await page.evaluate(() => {
			for (const img of document.querySelectorAll('img')) {
				img.style.setProperty('opacity', '1', 'important');
			}
		});
	}

	// Final stabilization delay for layout shifts
	await page.waitForTimeout(200);
}
