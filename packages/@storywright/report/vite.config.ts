import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite-plus";
import type { Plugin } from "vite";

/** Dev-only plugin: serves placeholder SVG images for /assets/* requests */
function placeholderImages(): Plugin {
  return {
    name: "placeholder-images",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/assets/")) return next();

        const isExpected = req.url.includes("/expected/");
        const isActual = req.url.includes("/actual/");
        const isDiff = req.url.includes("/diff/");
        if (!isExpected && !isActual && !isDiff) return next();

        const label = isExpected ? "Expected" : isActual ? "Actual" : "Diff";
        const color = isExpected ? "#3b82f6" : isActual ? "#22c55e" : "#ef4444";
        const name = decodeURIComponent(req.url.split("/").pop()?.replace(".png", "") ?? "");

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.15"/>
    </pattern>
  </defs>
  <rect width="800" height="600" fill="${color}" opacity="0.06"/>
  <rect width="800" height="600" fill="url(#grid)"/>
  <rect x="4" y="4" width="792" height="592" fill="none" stroke="${color}" stroke-width="2" rx="8" opacity="0.3"/>
  <text x="400" y="270" text-anchor="middle" font-family="system-ui,sans-serif" font-size="48" font-weight="bold" fill="${color}" opacity="0.4">${label}</text>
  <text x="400" y="320" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" fill="${color}" opacity="0.3">${name}</text>
  <text x="400" y="350" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="${color}" opacity="0.2">800 × 600</text>
</svg>`;

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "no-cache");
        res.end(svg);
      });
    },
  };
}

export default defineConfig({
  plugins: [placeholderImages(), svelte()],
  build: {
    outDir: "dist",
    cssCodeSplit: false,
    rollupOptions: {
      input: "src/main.ts",
      output: {
        entryFileNames: "index.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
});
