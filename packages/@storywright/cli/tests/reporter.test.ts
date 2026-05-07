import { describe, expect, it } from "vite-plus/test";
import { buildEntry } from "../src/playwright/reporter.js";

const noop = () => {};
const assetsDir = "/tmp/assets";

describe("buildEntry — type detection", () => {
  it("type=new when there are no attachments (Playwright skips capture for missing baseline)", () => {
    const entry = buildEntry(
      { title: "Button: Primary", project: "chromium", attachments: [] },
      assetsDir,
      noop,
    );
    expect(entry.type).toBe("new");
    expect(entry.story).toBe("Button");
    expect(entry.variant).toBe("Primary");
    expect(entry.browser).toBe("chromium");
  });

  it("type=diff when expected attachment is present (visual mismatch)", () => {
    const entry = buildEntry(
      {
        title: "Button: Primary",
        project: "chromium",
        attachments: [
          {
            name: "button--primary-expected.png",
            path: "/tmp/expected.png",
            contentType: "image/png",
          },
          {
            name: "button--primary-actual.png",
            path: "/tmp/actual.png",
            contentType: "image/png",
          },
          {
            name: "button--primary-diff.png",
            path: "/tmp/diff.png",
            contentType: "image/png",
          },
        ],
      },
      assetsDir,
      noop,
    );
    expect(entry.type).toBe("diff");
  });
});

describe("buildEntry — actual image path", () => {
  it("actual is empty when there are no attachments (original missing-baseline behavior)", () => {
    const entry = buildEntry(
      { title: "Button: Primary", project: "chromium", attachments: [] },
      assetsDir,
      noop,
    );
    expect(entry.actual).toBe("");
    expect(entry.expected).toBe("");
    expect(entry.diff).toBe("");
  });

  it("actual is set when fallback screenshot is attached with story-id-actual name", () => {
    const entry = buildEntry(
      {
        title: "Button: Primary",
        project: "chromium",
        attachments: [
          {
            name: "button--primary-actual",
            path: "/tmp/screenshot.png",
            contentType: "image/png",
          },
        ],
      },
      assetsDir,
      noop,
    );
    expect(entry.type).toBe("new");
    expect(entry.actual).toContain("assets/actual/");
    expect(entry.actual).toMatch(/\.png$/);
    expect(entry.expected).toBe("");
    expect(entry.diff).toBe("");
  });

  it("all three paths are set for a diff entry", () => {
    const entry = buildEntry(
      {
        title: "Card: Default",
        project: "firefox",
        attachments: [
          {
            name: "card-default-expected.png",
            path: "/tmp/expected.png",
            contentType: "image/png",
          },
          {
            name: "card-default-actual.png",
            path: "/tmp/actual.png",
            contentType: "image/png",
          },
          {
            name: "card-default-diff.png",
            path: "/tmp/diff.png",
            contentType: "image/png",
          },
        ],
      },
      assetsDir,
      noop,
    );
    expect(entry.type).toBe("diff");
    expect(entry.expected).toContain("assets/expected/");
    expect(entry.actual).toContain("assets/actual/");
    expect(entry.diff).toContain("assets/diff/");
  });
});

describe("buildEntry — attachment name matching", () => {
  it("ignores attachments without path", () => {
    const entry = buildEntry(
      {
        title: "Button: Primary",
        project: "chromium",
        attachments: [{ name: "button-actual.png", path: undefined, contentType: "image/png" }],
      },
      assetsDir,
      noop,
    );
    expect(entry.type).toBe("new");
    expect(entry.actual).toBe("");
  });

  it("ignores non-image attachments for type detection", () => {
    const entry = buildEntry(
      {
        title: "Button: Primary",
        project: "chromium",
        attachments: [
          { name: "trace-expected.zip", path: "/tmp/trace.zip", contentType: "application/zip" },
        ],
      },
      assetsDir,
      noop,
    );
    // non-image attachment with 'expected' in name must not trigger type=diff
    expect(entry.type).toBe("new");
  });

  it("calls copier for each matched attachment", () => {
    const copied: Array<{ src: string; dest: string }> = [];
    buildEntry(
      {
        title: "Button: Primary",
        project: "chromium",
        attachments: [
          {
            name: "button-expected.png",
            path: "/src/expected.png",
            contentType: "image/png",
          },
          {
            name: "button-actual.png",
            path: "/src/actual.png",
            contentType: "image/png",
          },
        ],
      },
      assetsDir,
      (src, dest) => copied.push({ src, dest }),
    );
    expect(copied).toHaveLength(2);
    expect(copied[0].src).toBe("/src/expected.png");
    expect(copied[1].src).toBe("/src/actual.png");
  });
});

describe("buildEntry — title parsing", () => {
  it("splits title on first ': ' into story and variant", () => {
    const entry = buildEntry(
      { title: "Components/Button: Primary Large", project: "chromium", attachments: [] },
      assetsDir,
      noop,
    );
    expect(entry.story).toBe("Components/Button");
    expect(entry.variant).toBe("Primary Large");
  });

  it("uses 'default' as variant when title has no ': ' separator", () => {
    const entry = buildEntry(
      { title: "Button", project: "chromium", attachments: [] },
      assetsDir,
      noop,
    );
    expect(entry.story).toBe("Button");
    expect(entry.variant).toBe("default");
  });
});
