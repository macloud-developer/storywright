import { describe, expect, it } from "vite-plus/test";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import { excludeStoriesForBrowser, filterStories } from "../src/core/storybook.js";
import type { StoryIndex } from "../src/core/types.js";

const stubIndex: StoryIndex = {
  v: 5,
  entries: {
    "button--primary": {
      id: "button--primary",
      title: "Components/Button",
      name: "Primary",
      importPath: "./src/Button.stories.ts",
      type: "story",
      tags: [],
    },
    "button--docs": {
      id: "button--docs",
      title: "Components/Button",
      name: "Docs",
      importPath: "./src/Button.stories.ts",
      type: "docs",
      tags: [],
    },
    "form--default": {
      id: "form--default",
      title: "Components/Form",
      name: "Default",
      importPath: "./src/Form.stories.ts",
      type: "story",
      tags: [],
    },
    "animated--spin": {
      id: "animated--spin",
      title: "Components/Animated",
      name: "Spin",
      importPath: "./src/Animated.stories.ts",
      type: "story",
      tags: ["!vrt"],
    },
  },
};

describe("filterStories", () => {
  it("should exclude docs entries", () => {
    const result = filterStories(stubIndex, DEFAULT_CONFIG);
    expect(result.entries["button--docs"]).toBeUndefined();
  });

  it("should exclude stories via exclude pattern", () => {
    const config = { ...DEFAULT_CONFIG, exclude: ["**/Animated/**"] };
    const result = filterStories(stubIndex, config);
    expect(result.entries["animated--spin"]).toBeUndefined();
    expect(result.entries["button--primary"]).toBeDefined();
  });

  it("should include regular stories with default config", () => {
    const result = filterStories(stubIndex, DEFAULT_CONFIG);
    expect(result.entries["button--primary"]).toBeDefined();
    expect(result.entries["form--default"]).toBeDefined();
  });

  it("should apply exclude patterns", () => {
    const config = { ...DEFAULT_CONFIG, exclude: ["Components/Form/**"] };
    const result = filterStories(stubIndex, config);
    expect(result.entries["form--default"]).toBeUndefined();
    expect(result.entries["button--primary"]).toBeDefined();
  });

  it("should apply include patterns", () => {
    const config = { ...DEFAULT_CONFIG, include: ["Components/Button/**"] };
    const result = filterStories(stubIndex, config);
    expect(result.entries["button--primary"]).toBeDefined();
    expect(result.entries["form--default"]).toBeUndefined();
  });
});

describe("excludeStoriesForBrowser", () => {
  const filteredIndex = filterStories(stubIndex, DEFAULT_CONFIG);

  it("should exclude stories matching the pattern", () => {
    const result = excludeStoriesForBrowser(filteredIndex, ["**/Animated/**"]);
    expect(result.entries["animated--spin"]).toBeUndefined();
    expect(result.entries["button--primary"]).toBeDefined();
  });

  it("should return all stories when exclude patterns are empty", () => {
    const result = excludeStoriesForBrowser(filteredIndex, []);
    expect(Object.keys(result.entries)).toEqual(Object.keys(filteredIndex.entries));
  });

  it("should apply multiple exclude patterns", () => {
    const result = excludeStoriesForBrowser(filteredIndex, ["**/Button/**", "**/Form/**"]);
    expect(result.entries["button--primary"]).toBeUndefined();
    expect(result.entries["form--default"]).toBeUndefined();
    expect(result.entries["animated--spin"]).toBeDefined();
  });
});
