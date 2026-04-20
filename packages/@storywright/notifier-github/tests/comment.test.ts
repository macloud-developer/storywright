import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { upsertPrComment } from "../src/comment.js";
import { MARKER } from "../src/markdown.js";
import type { GitHubEnv } from "../src/env.js";

const env: GitHubEnv = {
  token: "ghp_test",
  owner: "owner",
  repo: "repo",
  prNumber: 42,
};

const markdown = `## Report\n\n${MARKER}\n`;

describe("upsertPrComment", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create new comment when no marker found", async () => {
    // GET comments → empty
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });
    // POST new comment
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 1 }),
    });

    await upsertPrComment(env, markdown, {});

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const postCall = fetchMock.mock.calls[1];
    expect(postCall[0]).toBe("https://api.github.com/repos/owner/repo/issues/42/comments");
    expect(postCall[1].method).toBe("POST");
  });

  it("should update existing comment when marker found", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { id: 100, body: "unrelated comment" },
        { id: 200, body: `old report\n${MARKER}\n` },
      ],
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 200 }),
    });

    await upsertPrComment(env, markdown, {});

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const patchCall = fetchMock.mock.calls[1];
    expect(patchCall[0]).toBe("https://api.github.com/repos/owner/repo/issues/comments/200");
    expect(patchCall[1].method).toBe("PATCH");
  });

  it("should delete comment when deleteOnPass and allPassed", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: 300, body: `report\n${MARKER}\n` }],
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
    });

    await upsertPrComment(env, markdown, { deleteOnPass: true, allPassed: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const deleteCall = fetchMock.mock.calls[1];
    expect(deleteCall[0]).toBe("https://api.github.com/repos/owner/repo/issues/comments/300");
    expect(deleteCall[1].method).toBe("DELETE");
  });

  it("should do nothing when deleteOnPass, allPassed, and no existing comment", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    await upsertPrComment(env, markdown, { deleteOnPass: true, allPassed: true });

    expect(fetchMock).toHaveBeenCalledTimes(1); // only GET
  });

  it("should handle pagination to find marker on second page", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      body: `comment ${i}`,
    }));
    const page2 = [{ id: 500, body: `old\n${MARKER}\n` }];

    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => page1 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => page2 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 500 }) });

    await upsertPrComment(env, markdown, {});

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const patchCall = fetchMock.mock.calls[2];
    expect(patchCall[0]).toBe("https://api.github.com/repos/owner/repo/issues/comments/500");
    expect(patchCall[1].method).toBe("PATCH");
  });
});
