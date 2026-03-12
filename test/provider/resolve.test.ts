import { describe, expect, it } from "vitest";
import { CliError } from "../../src/core/errors.js";
import {
  applyModelOverride,
  inferProviderFromModel,
  resolveProviderPlaceholders,
  resolveSupportedProvider,
} from "../../src/provider/resolve.js";
import type { WorkflowMetadata } from "../../src/registry/schemas.js";
import type { OpenCiConfig } from "../../src/template/schemas.js";

const metadata: WorkflowMetadata = {
  name: "pr-review",
  displayName: "Pull Request Review",
  description: "Automated review",
  version: "1.0.0",
  author: "openci",
  tags: ["code-review"],
  provider: ["claude", "codex"],
  runtimes: ["action"],
  runners: ["github-ubuntu"],
  defaultRuntime: "action",
  defaultRunner: "github-ubuntu",
  smart: true,
  requiredSecrets: {
    claude: ["ANTHROPIC_API_KEY"],
    codex: ["OPENAI_API_KEY"],
  },
  triggers: ["pull_request"],
  stacks: ["any"],
  minGitHubActionsVersion: null,
};

const config: OpenCiConfig = {
  detect: {},
  defaults: {},
  providerModes: {},
  runners: {},
  substitutions: {},
};

describe("provider resolution", () => {
  it("infers provider from the model name", () => {
    expect(inferProviderFromModel("claude-opus-4-6")).toBe("claude");
    expect(inferProviderFromModel("codex-mini")).toBe("codex");
  });

  it("overrides the provider model line", () => {
    expect(applyModelOverride("model: claude-sonnet-4-6", "claude-opus-4-6")).toBe(
      "model: claude-opus-4-6",
    );
  });

  it("throws when provider and model disagree", () => {
    expect(() =>
      resolveProviderPlaceholders({
        metadata,
        config,
        provider: "claude",
        model: "codex-mini",
      }),
    ).toThrow(CliError);
  });

  it("supports script runtime providers", () => {
    const resolved = resolveProviderPlaceholders({
      metadata: {
        ...metadata,
        provider: ["glm"],
        runtimes: ["script"],
        runners: ["self-hosted-a8"],
        defaultRuntime: "script",
        defaultRunner: "self-hosted-a8",
      },
      config: {
        ...config,
        defaults: { provider: "glm", runtime: "script", runner: "self-hosted-a8" },
      },
      provider: "glm",
      runtime: "script",
    });

    expect(resolved.runtime).toBe("script");
    expect(resolved.placeholders.PROVIDER_STEP).toContain("node scripts/run-provider.js glm");
  });

  it("rejects unsupported runtime overrides", () => {
    expect(() =>
      resolveProviderPlaceholders({
        metadata: {
          ...metadata,
          provider: ["glm"],
          runtimes: ["script"],
          defaultRuntime: "script",
        },
        config,
        provider: "glm",
        runtime: "action",
      }),
    ).toThrow(CliError);
  });

  it("rejects unsupported runner overrides", () => {
    expect(() =>
      resolveProviderPlaceholders({
        metadata,
        config,
        provider: "claude",
        runner: "self-hosted-a8",
      }),
    ).toThrow(CliError);
  });

  it("allows providerless workflows without forcing a provider", () => {
    const provider = resolveSupportedProvider(
      {
        ...metadata,
        provider: [],
        runtimes: [],
        runners: ["github-ubuntu"],
        defaultRuntime: undefined,
      },
      undefined,
    );

    expect(provider).toBeUndefined();
  });

  it("rejects runtime overrides for providerless workflows", () => {
    expect(() =>
      resolveProviderPlaceholders({
        metadata: {
          ...metadata,
          provider: [],
          runtimes: [],
        },
        config,
        runtime: "action",
      }),
    ).toThrow(CliError);
  });
});
