import { describe, expect, it, vi } from "vite-plus/test";
import type { NotificationContext, Notifier } from "../../src/notifier/types.js";
import { runNotifiers } from "../../src/notifier/runner.js";
import type { TestSummary } from "../../src/core/types.js";
import type { StorywrightConfig } from "../../src/config/types.js";

const mockSummary: TestSummary = {
  total: 10,
  passed: 10,
  failed: 0,
  skipped: 0,
  duration: 5000,
  timestamp: "2026-01-01T00:00:00Z",
  browsers: ["chromium"],
  entries: [],
};

const mockContext: NotificationContext = {
  summary: mockSummary,
  exitCode: 0,
  reportDir: ".storywright/report",
  config: {} as StorywrightConfig,
};

describe("runNotifiers", () => {
  it("should call all notifiers in order", async () => {
    const order: string[] = [];
    const a: Notifier = {
      name: "a",
      notify: vi.fn(async () => {
        order.push("a");
        return { posted: true };
      }),
    };
    const b: Notifier = {
      name: "b",
      notify: vi.fn(async () => {
        order.push("b");
        return { posted: true };
      }),
    };

    await runNotifiers([a, b], mockContext);
    expect(a.notify).toHaveBeenCalledWith(mockContext);
    expect(b.notify).toHaveBeenCalledWith(mockContext);
    expect(order).toEqual(["a", "b"]);
  });

  it("should continue when a notifier throws", async () => {
    const failing: Notifier = {
      name: "failing",
      notify: vi.fn(async () => {
        throw new Error("fail");
      }),
    };
    const passing: Notifier = {
      name: "passing",
      notify: vi.fn(async () => ({ posted: true })),
    };

    await runNotifiers([failing, passing], mockContext);
    expect(failing.notify).toHaveBeenCalled();
    expect(passing.notify).toHaveBeenCalled();
  });

  it("should not throw when a notifier fails", async () => {
    const failing: Notifier = {
      name: "failing",
      notify: vi.fn(async () => {
        throw new Error("boom");
      }),
    };

    await expect(runNotifiers([failing], mockContext)).resolves.toBeUndefined();
  });

  it("should handle empty notifiers array", async () => {
    await expect(runNotifiers([], mockContext)).resolves.toBeUndefined();
  });

  it("should handle context without summary (on-error case)", async () => {
    const errorContext: NotificationContext = {
      exitCode: 2,
      reportDir: ".storywright/report",
      config: {} as StorywrightConfig,
    };
    const notifier: Notifier = {
      name: "test",
      notify: vi.fn(async () => ({ posted: true })),
    };

    await runNotifiers([notifier], errorContext);
    expect(notifier.notify).toHaveBeenCalledWith(errorContext);
  });
});
