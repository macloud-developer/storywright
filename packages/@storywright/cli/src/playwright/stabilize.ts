/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import type { Page } from "@playwright/test";

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
        "*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }",
    });
  }

  // Wait for story to render: content inside #storybook-root OR portal content on body
  await page.waitForFunction(
    () => {
      const root = document.getElementById("storybook-root");
      if (!root) return false;
      if (root.childElementCount > 0) return true;
      for (const el of document.body.children) {
        if (el.tagName === "SCRIPT" || el.id === "storybook-root" || el.id === "storybook-docs")
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

  // Wait for in-flight resource loads to settle first. This covers resources
  // document.images cannot see (CSS background images, video posters,
  // SVG <image>) and images not yet in the DOM (async fetches, Suspense,
  // delayed renders), which the poll below would miss if it ran while
  // document.images was still empty.
  await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});

  // Wait for every image to finish loading. Polling re-reads document.images
  // each time, so images added to the DOM after stabilization started are
  // also awaited. Lazy images are forced to eager on every poll for the same
  // reason.
  await page
    .waitForFunction(
      () => {
        const images = Array.from(document.images);
        for (const img of images) {
          if (img.loading === "lazy") img.loading = "eager";
        }
        return images.every((img) => img.complete);
      },
      { polling: 100, timeout: 10000 },
    )
    .catch(() => {
      console.warn(
        "[storywright] some images did not finish loading within 10s; screenshot may be incomplete",
      );
    });

  // A loaded image may still be undecoded and capture as a blank area
  await page.evaluate(() =>
    Promise.allSettled(Array.from(document.images).map((img) => img.decode())).then(
      () => undefined,
    ),
  );

  if (options.disableAnimations) {
    await page.evaluate(() => {
      for (const img of document.querySelectorAll("img")) {
        img.style.setProperty("opacity", "1", "important");
      }
    });
  }

  // Final stabilization delay for layout shifts
  await page.waitForTimeout(200);
}
