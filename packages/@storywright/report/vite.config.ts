import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [svelte()],
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
