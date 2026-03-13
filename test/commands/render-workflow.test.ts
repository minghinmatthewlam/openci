import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderWorkflow } from "../../src/commands/render-workflow.js";
import type { WorkflowBundle } from "../../src/registry/resolve.js";
import type { WorkflowMetadata } from "../../src/registry/schemas.js";

function makeMetadata(overrides: Partial<WorkflowMetadata> = {}): WorkflowMetadata {
  return {
    name: "test-workflow",
    displayName: "Test Workflow",
    description: "A test workflow",
    version: "1.0.0",
    author: "openci",
    tags: [],
    provider: ["claude"],
    runtimes: ["action"],
    runners: ["github-ubuntu"],
    defaultRuntime: "action",
    defaultRunner: "github-ubuntu",
    smart: false,
    requiredSecrets: {},
    triggers: ["pull_request"],
    stacks: ["any"],
    ...overrides,
  };
}

describe("renderWorkflow", () => {
  it("passes through a non-smart workflow unchanged", async () => {
    const bundle: WorkflowBundle = {
      metadata: makeMetadata({ smart: false }),
      readme: "",
      workflow: "name: test\non: push\njobs: {}",
      sourceLabel: "test",
    };

    const result = await renderWorkflow(bundle, "/tmp/fake-repo", {});

    expect(result.output).toBe("name: test\non: push\njobs: {}");
    expect(result.provider).toBe("claude");
    expect(result.runtime).toBe("action");
    expect(result.runner).toBe("github-ubuntu");
    expect(result.detected).toBeUndefined();
    expect(result.context).toBeUndefined();
  });

  it("resolves provider from flags", async () => {
    const bundle: WorkflowBundle = {
      metadata: makeMetadata({ provider: ["claude", "codex"] }),
      readme: "",
      workflow: "name: test",
      sourceLabel: "test",
    };

    const result = await renderWorkflow(bundle, "/tmp/fake-repo", { provider: "codex" });

    expect(result.provider).toBe("codex");
  });

  it("throws when a smart workflow is missing template files", async () => {
    const bundle: WorkflowBundle = {
      metadata: makeMetadata({ smart: true }),
      readme: "",
      sourceLabel: "test",
    };

    await expect(renderWorkflow(bundle, "/tmp/fake-repo", {})).rejects.toThrow(
      "missing smart workflow files",
    );
  });

  it("throws when output is empty", async () => {
    const bundle: WorkflowBundle = {
      metadata: makeMetadata({ smart: false }),
      readme: "",
      workflow: undefined,
      sourceLabel: "test",
    };

    await expect(renderWorkflow(bundle, "/tmp/fake-repo", {})).rejects.toThrow(
      "could not be resolved",
    );
  });

  it("returns defaults from metadata when no flags provided", async () => {
    const bundle: WorkflowBundle = {
      metadata: makeMetadata({
        runtimes: ["script", "action"],
        runners: ["self-hosted-a8", "github-ubuntu"],
        defaultRuntime: "script",
        defaultRunner: "self-hosted-a8",
      }),
      readme: "",
      workflow: "name: test",
      sourceLabel: "test",
    };

    const result = await renderWorkflow(bundle, "/tmp/fake-repo", {});

    expect(result.runtime).toBe("script");
    expect(result.runner).toBe("self-hosted-a8");
  });

  it("falls back to first runtime/runner when no defaults set", async () => {
    const bundle: WorkflowBundle = {
      metadata: makeMetadata({
        runtimes: ["script", "action"],
        runners: ["self-hosted-a8", "github-ubuntu"],
        defaultRuntime: undefined,
        defaultRunner: undefined,
      }),
      readme: "",
      workflow: "name: test",
      sourceLabel: "test",
    };

    const result = await renderWorkflow(bundle, "/tmp/fake-repo", {});

    expect(result.runtime).toBe("script");
    expect(result.runner).toBe("self-hosted-a8");
  });
});
