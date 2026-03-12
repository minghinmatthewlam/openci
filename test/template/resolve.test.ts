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
  providers: {
    claude: {
      AGENT_ACTION: "anthropics/claude-code-action@v1",
      AGENT_AUTH_KEY: "anthropic_api_key",
      AGENT_SECRET_NAME: "ANTHROPIC_API_KEY",
      AGENT_EXTRA_ARGS: "model: claude-sonnet-4-6",
    },
    codex: {
      AGENT_ACTION: "openai/codex-action@v1",
      AGENT_AUTH_KEY: "openai-api-key",
      AGENT_SECRET_NAME: "OPENAI_API_KEY",
      AGENT_EXTRA_ARGS: "model: codex-mini",
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
});
