export type SupportedRuntime = "action" | "script";

export interface ActionRuntimeDefinition {
  action: string;
  authKey?: string | undefined;
  secretName?: string | undefined;
  extraArgs?: string | undefined;
}

export interface ScriptRuntimeDefinition {
  env?: Record<string, string> | undefined;
  run: string;
}

export interface ProviderDefinition {
  defaultModel?: string | undefined;
  defaultRuntime?: SupportedRuntime | undefined;
  displayName: string;
  modelPrefixes?: string[] | undefined;
  runtimes: Partial<{
    action: ActionRuntimeDefinition;
    script: ScriptRuntimeDefinition;
  }>;
  supportedRuntimes: SupportedRuntime[];
}

export const PROVIDER_REGISTRY: Record<string, ProviderDefinition> = {
  claude: {
    displayName: "Claude",
    modelPrefixes: ["claude-"],
    defaultModel: "claude-sonnet-4-6",
    defaultRuntime: "action",
    supportedRuntimes: ["action", "script"],
    runtimes: {
      action: {
        action: "anthropics/claude-code-action@v1",
        authKey: "anthropic_api_key",
        secretName: "ANTHROPIC_API_KEY",
        extraArgs: "model: claude-sonnet-4-6",
      },
      script: {
        env: {
          ANTHROPIC_API_KEY: "${{ secrets.ANTHROPIC_API_KEY }}",
          MODEL: "claude-sonnet-4-6",
        },
        run: "node scripts/run-provider.js claude",
      },
    },
  },
  codex: {
    displayName: "Codex",
    modelPrefixes: ["codex-"],
    defaultModel: "codex-mini",
    defaultRuntime: "action",
    supportedRuntimes: ["action", "script"],
    runtimes: {
      action: {
        action: "openai/codex-action@v1",
        authKey: "openai-api-key",
        secretName: "OPENAI_API_KEY",
        extraArgs: "model: codex-mini",
      },
      script: {
        env: {
          OPENAI_API_KEY: "${{ secrets.OPENAI_API_KEY }}",
          MODEL: "codex-mini",
        },
        run: "node scripts/run-provider.js codex",
      },
    },
  },
  glm: {
    displayName: "GLM",
    modelPrefixes: ["glm-"],
    defaultModel: "glm-4.7",
    defaultRuntime: "script",
    supportedRuntimes: ["script"],
    runtimes: {
      script: {
        env: {
          GLM_API_KEY: "${{ secrets.GLM_API_KEY }}",
          MODEL: "glm-4.7",
        },
        run: "node scripts/run-provider.js glm",
      },
    },
  },
  custom: {
    displayName: "Custom",
    defaultRuntime: "script",
    supportedRuntimes: ["script"],
    runtimes: {
      script: {
        run: "node scripts/run-provider.js custom",
      },
    },
  },
};

export function getProviderDefinition(provider: string): ProviderDefinition | undefined {
  return PROVIDER_REGISTRY[provider];
}
