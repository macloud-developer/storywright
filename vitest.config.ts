import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["packages/*/tests/**/*.test.ts", "packages/@storywright/*/tests/**/*.test.ts"],
  },
});
