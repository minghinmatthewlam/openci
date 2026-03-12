import { afterEach, describe, expect, it } from "vitest";
import {
  listRegistryWorkflows,
  readRegistry,
  readWorkflowBundle,
  readWorkflowBundleByAuthor,
} from "../lib/registry";

describe("registry loader", () => {
  afterEach(() => {
    delete process.env.OPENCI_WEB_REGISTRY_PATH;
  });

  it("loads the default local registry document", async () => {
    const registry = await readRegistry();

    expect(registry.version).toBe(1);
    expect(registry.workflows.length).toBeGreaterThan(0);
  });

  it("lists workflows alphabetically", async () => {
    const workflows = await listRegistryWorkflows();

    expect(workflows.map((workflow) => workflow.name)).toEqual([
      "claude-pr-review-nextjs-pnpm",
      "commit-lint",
      "issue-resolver",
      "pr-review",
      "release-notes",
      "review-gate",
      "security-scan",
    ]);
  });

  it("reads a workflow bundle with metadata and README", async () => {
    const bundle = await readWorkflowBundle("pr-review");

    expect(bundle?.metadata.displayName).toBe("Pull Request Review");
    expect(bundle?.readme).toContain("Pull Request Review");
    expect(bundle?.metadata.repository).toBe("minghinmatthewlam/openci");
    expect(bundle?.metadata.runtimes).toEqual(["action", "script"]);
    expect(bundle?.metadata.runners).toEqual(["github-ubuntu", "self-hosted-a8"]);
  });

  it("requires author and name to match for detail lookups", async () => {
    const ok = await readWorkflowBundleByAuthor("openci", "pr-review");
    const mismatch = await readWorkflowBundleByAuthor("wrong-author", "pr-review");

    expect(ok?.metadata.author).toBe("openci");
    expect(mismatch).toBeUndefined();
  });
});
