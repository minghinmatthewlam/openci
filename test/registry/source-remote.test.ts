import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sourceRepoFixture } from "../helpers/paths.js";

const githubApiFetch = vi.fn();
const cloneGitRepo = vi.fn();

vi.mock("../../src/github/api.js", () => ({
  githubApiFetch,
}));

vi.mock("../../src/registry/github.js", () => ({
  cloneGitRepo,
}));

const { fetchWorkflowFile, listAvailableWorkflows } = await import("../../src/registry/source.js");

describe("remote GitHub shorthand sources", () => {
  const tempDirs: string[] = [];

  beforeEach(() => {
    githubApiFetch.mockReset();
    cloneGitRepo.mockReset();
  });

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("passes HTTPS and SSH clone candidates for GitHub shorthand fallback", async () => {
    githubApiFetch.mockResolvedValue(undefined);
    cloneGitRepo.mockResolvedValue({
      path: sourceRepoFixture,
      sourceLabel: "owner/private-workflows",
      cleanup: vi.fn(),
    });

    const result = await listAvailableWorkflows({
      cwd: "/tmp",
      sourceArg: "owner/private-workflows",
    });

    expect(result.workflows.map((workflow) => workflow.name)).toContain("pr-review");
    expect(cloneGitRepo).toHaveBeenCalledWith({
      kind: "git",
      repoUrl: "https://github.com/owner/private-workflows.git",
      fallbackRepoUrls: ["git@github.com:owner/private-workflows.git"],
      sourceLabel: "owner/private-workflows",
    });
  });

  it("keeps .git-suffixed GitHub shorthand on the fallback path", async () => {
    githubApiFetch.mockResolvedValue(undefined);
    cloneGitRepo.mockResolvedValue({
      path: sourceRepoFixture,
      sourceLabel: "owner/private-workflows",
      cleanup: vi.fn(),
    });

    await listAvailableWorkflows({
      cwd: "/tmp",
      sourceArg: "owner/private-workflows.git",
    });

    expect(cloneGitRepo).toHaveBeenCalledWith({
      kind: "git",
      repoUrl: "https://github.com/owner/private-workflows.git",
      fallbackRepoUrls: ["git@github.com:owner/private-workflows.git"],
      sourceLabel: "owner/private-workflows",
    });
  });

  it("keeps github:-prefixed .git shorthand on the fallback path", async () => {
    githubApiFetch.mockResolvedValue(undefined);
    cloneGitRepo.mockResolvedValue({
      path: sourceRepoFixture,
      sourceLabel: "owner/private-workflows",
      cleanup: vi.fn(),
    });

    await fetchWorkflowFile({
      cwd: "/tmp",
      sourceArg: "github:owner/private-workflows.git",
      workflow: "pr-review",
    });

    expect(cloneGitRepo).toHaveBeenCalledWith({
      kind: "git",
      repoUrl: "https://github.com/owner/private-workflows.git",
      fallbackRepoUrls: ["git@github.com:owner/private-workflows.git"],
      sourceLabel: "owner/private-workflows",
    });
  });

  it("uses the same clone fallback path when fetching a workflow file", async () => {
    githubApiFetch.mockResolvedValue(undefined);
    cloneGitRepo.mockResolvedValue({
      path: sourceRepoFixture,
      sourceLabel: "owner/private-workflows",
      cleanup: vi.fn(),
    });

    const result = await fetchWorkflowFile({
      cwd: "/tmp",
      sourceArg: "owner/private-workflows",
      workflow: "pr-review",
    });

    expect(result.file.name).toBe("pr-review");
    expect(result.file.content).toContain("anthropics/claude-code-action");
    expect(cloneGitRepo).toHaveBeenCalledWith({
      kind: "git",
      repoUrl: "https://github.com/owner/private-workflows.git",
      fallbackRepoUrls: ["git@github.com:owner/private-workflows.git"],
      sourceLabel: "owner/private-workflows",
    });
  });

  it("preserves explicit SSH GitHub URLs instead of rewriting them to shorthand fallback", async () => {
    cloneGitRepo.mockResolvedValue({
      path: sourceRepoFixture,
      sourceLabel: "git@github.com:owner/private-workflows.git",
      cleanup: vi.fn(),
    });

    await fetchWorkflowFile({
      cwd: "/tmp",
      sourceArg: "git@github.com:owner/private-workflows.git",
      workflow: "pr-review",
    });

    expect(cloneGitRepo).toHaveBeenCalledWith({
      kind: "git",
      repoUrl: "git@github.com:owner/private-workflows.git",
      sourceLabel: "git@github.com:owner/private-workflows.git",
    });
  });

  it("preserves explicit HTTPS GitHub URLs instead of rewriting them to shorthand fallback", async () => {
    cloneGitRepo.mockResolvedValue({
      path: sourceRepoFixture,
      sourceLabel: "https://github.com/owner/private-workflows.git",
      cleanup: vi.fn(),
    });

    await listAvailableWorkflows({
      cwd: "/tmp",
      sourceArg: "https://github.com/owner/private-workflows.git",
    });

    expect(cloneGitRepo).toHaveBeenCalledWith({
      kind: "git",
      repoUrl: "https://github.com/owner/private-workflows.git",
      sourceLabel: "https://github.com/owner/private-workflows.git",
    });
  });

  it("reports the original source label when a cloned repo has no workflows directory", async () => {
    githubApiFetch.mockResolvedValue(undefined);
    const clonedPath = await mkdtemp(join(tmpdir(), "openci-remote-no-workflows-"));
    tempDirs.push(clonedPath);
    cloneGitRepo.mockResolvedValue({
      path: clonedPath,
      sourceLabel: "owner/private-workflows",
      cleanup: vi.fn(),
    });

    await expect(
      listAvailableWorkflows({
        cwd: "/tmp",
        sourceArg: "owner/private-workflows",
      }),
    ).rejects.toThrow("No .github/workflows/ directory found in 'owner/private-workflows'.");
    await expect(
      listAvailableWorkflows({
        cwd: "/tmp",
        sourceArg: "owner/private-workflows",
      }),
    ).rejects.not.toThrow(/openci-remote-no-workflows-/);
  });
});
