import { beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    githubApiFetch.mockReset();
    cloneGitRepo.mockReset();
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
});
