import { describe, expect, it } from "vitest";
import { fetchWorkflowFile, listAvailableWorkflows } from "../../src/registry/source.js";
import { sourceRepoFixture } from "../helpers/paths.js";

describe("listAvailableWorkflows", () => {
  it("lists all workflow files from fixture source repo", async () => {
    const result = await listAvailableWorkflows({
      cwd: "/tmp",
      sourceArg: sourceRepoFixture,
    });
    expect(result.workflows.length).toBe(3);
    const names = result.workflows.map((w) => w.name);
    expect(names).toContain("ci");
    expect(names).toContain("issue-triage");
    expect(names).toContain("pr-review");
  });

  it("includes .yaml extension files", async () => {
    const result = await listAvailableWorkflows({
      cwd: "/tmp",
      sourceArg: sourceRepoFixture,
    });
    const ci = result.workflows.find((w) => w.name === "ci");
    expect(ci?.filename).toBe("ci.yaml");
  });

  it("throws for path without .github/workflows/", async () => {
    await expect(listAvailableWorkflows({ cwd: "/tmp", sourceArg: "/tmp" })).rejects.toThrow(
      "No .github/workflows/",
    );
  });
});

describe("fetchWorkflowFile", () => {
  it("fetches a specific workflow by name", async () => {
    const result = await fetchWorkflowFile({
      cwd: "/tmp",
      sourceArg: sourceRepoFixture,
      workflow: "pr-review",
    });
    expect(result.file.name).toBe("pr-review");
    expect(result.file.filename).toBe("pr-review.yml");
    expect(result.file.content).toContain("anthropics/claude-code-action");
    expect(result.file.contentHash).toBeTruthy();
    expect(result.file.source).toBe(sourceRepoFixture);
  });

  it("fetches .yaml extension workflow", async () => {
    const result = await fetchWorkflowFile({
      cwd: "/tmp",
      sourceArg: sourceRepoFixture,
      workflow: "ci",
    });
    expect(result.file.filename).toBe("ci.yaml");
    expect(result.file.content).toContain("npm test");
  });

  it("strips extension if provided", async () => {
    const result = await fetchWorkflowFile({
      cwd: "/tmp",
      sourceArg: sourceRepoFixture,
      workflow: "pr-review.yml",
    });
    expect(result.file.name).toBe("pr-review");
  });

  it("throws for nonexistent workflow", async () => {
    await expect(
      fetchWorkflowFile({
        cwd: "/tmp",
        sourceArg: sourceRepoFixture,
        workflow: "nonexistent",
      }),
    ).rejects.toThrow("Workflow 'nonexistent' not found");
  });

  it("includes available workflows in error message", async () => {
    try {
      await fetchWorkflowFile({
        cwd: "/tmp",
        sourceArg: sourceRepoFixture,
        workflow: "nonexistent",
      });
      expect.fail("should have thrown");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain("pr-review");
      expect(message).toContain("ci");
    }
  });
});
