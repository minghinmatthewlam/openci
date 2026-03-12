import { describe, expect, it } from "vitest";
import { resolveTemplateContext } from "../../src/template/resolve.js";
import type { DetectionResult } from "../../src/detection/index.js";
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
  detect: {
    packageManager: true,
    validationCommand: true,
    framework: true,
    defaultBranch: true,
    nodeVersion: true,
  },
  defaults: {},
  providerModes: {},
  runners: {
    "github-ubuntu": {
      runsOn: "ubuntu-latest",
    },
  },
  substitutions: {
    INSTALL_CMD: {
      npm: "npm ci",
      pnpm: "pnpm install --frozen-lockfile",
    },
    VALIDATION_CMD: {
      _default: "npm test",
    },
    TARGET_BRANCH: {
      _default: "main",
      _detect: "defaultBranch",
    },
    NODE_VERSION: {
      _default: "20",
      _detect: "nodeVersion",
    },
    FRAMEWORK: {
      _default: "Node.js",
      _detect: "framework",
    },
    PACKAGE_MANAGER: {
      _default: "npm",
      _detect: "packageManager",
    },
  },
};

const detected: DetectionResult = {
  packageManager: "pnpm",
  nodeVersion: "24.14.0",
  defaultBranch: "main",
  framework: "Next.js",
  validationCommand: "pnpm check",
  warnings: [],
};

describe("resolveTemplateContext", () => {
  it("resolves provider placeholders and detected substitutions", () => {
    const resolved = resolveTemplateContext({
      metadata,
      config,
      detected,
      flags: {},
    });

    expect(resolved.provider).toBe("claude");
    expect(resolved.context.INSTALL_CMD).toBe("pnpm install --frozen-lockfile");
    expect(resolved.context.VALIDATION_CMD).toBe("pnpm check");
    expect(resolved.context.NODE_VERSION).toBe("24.14.0");
    expect(resolved.context.RUNS_ON).toBe("ubuntu-latest");
  });

  it("lets CLI flags override detected values", () => {
    const resolved = resolveTemplateContext({
      metadata,
      config,
      detected,
      flags: {
        branch: "develop",
      },
    });

    expect(resolved.context.TARGET_BRANCH).toBe("develop");
  });

  it("resolves script runtime blocks and runner overrides", () => {
    const resolved = resolveTemplateContext({
      metadata: {
        ...metadata,
        provider: ["glm"],
        runtimes: ["script"],
        runners: ["self-hosted-a8"],
        defaultRuntime: "script",
        defaultRunner: "self-hosted-a8",
        requiredSecrets: { glm: ["GLM_API_KEY"] },
      },
      config: {
        ...config,
        defaults: { provider: "glm", runtime: "script", runner: "self-hosted-a8" },
        providerModes: {
          glm: {
            runtime: "script",
            script: {
              env: { GLM_API_KEY: "${{ secrets.GLM_API_KEY }}" },
              run: "node scripts/run-provider.js glm",
            },
          },
        },
        runners: {
          "self-hosted-a8": {
            runsOn: ["self-hosted", "linux", "x64", "a8"],
          },
        },
      },
      detected,
      flags: {
        runtime: "script",
        runner: "self-hosted-a8",
      },
    });

    expect(resolved.runtime).toBe("script");
    expect(resolved.context.RUNS_ON).toBe("[self-hosted, linux, x64, a8]");
    expect(resolved.context.PROVIDER_STEP).toContain("node scripts/run-provider.js glm");
  });

  it("uses provider-mode runner defaults when no runner flag is supplied", () => {
    const resolved = resolveTemplateContext({
      metadata: {
        ...metadata,
        provider: ["glm"],
        runtimes: ["script"],
        runners: ["self-hosted-a8"],
        defaultRuntime: "script",
        defaultRunner: "github-ubuntu",
        requiredSecrets: { glm: ["GLM_API_KEY"] },
      },
      config: {
        ...config,
        defaults: { provider: "glm", runtime: "script", runner: "github-ubuntu" },
        providerModes: {
          glm: {
            runtime: "script",
            runner: "self-hosted-a8",
            script: {
              env: { GLM_API_KEY: "${{ secrets.GLM_API_KEY }}" },
              run: "node scripts/run-provider.js glm",
            },
          },
        },
        runners: {
          ...config.runners,
          "self-hosted-a8": {
            runsOn: ["self-hosted", "linux", "x64", "a8"],
          },
        },
      },
      detected,
      flags: {},
    });

    expect(resolved.runner).toBe("self-hosted-a8");
    expect(resolved.context.RUNS_ON).toBe("[self-hosted, linux, x64, a8]");
  });
});
