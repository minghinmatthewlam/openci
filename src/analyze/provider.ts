export interface ProviderInfo {
  name: string;
  action: string;
  model?: string;
}

const PROVIDER_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /uses:\s*anthropics\/claude-code-action@/m, name: "Claude" },
  { pattern: /uses:\s*anthropics\/claude-code-security-review@/m, name: "Claude" },
  { pattern: /uses:\s*openai\/codex-action@/m, name: "Codex" },
  { pattern: /uses:\s*google-github-actions\/run-gemini-cli@/m, name: "Gemini" },
];

const ACTION_RE = /uses:\s*([\w.-]+\/[\w.-]+@[\w.-]+)/m;
const CLAUDE_MODEL_RE = /--model\s+([\w.-]+)/;
const MODEL_INPUT_RE = /model:\s*([\w.-]+)/m;

export function detectProvider(yamlContent: string): ProviderInfo | undefined {
  for (const { pattern, name } of PROVIDER_PATTERNS) {
    if (pattern.test(yamlContent)) {
      const actionMatch = yamlContent.match(ACTION_RE);
      const action = actionMatch?.[1] ?? "unknown";

      let model: string | undefined;
      if (name === "Claude") {
        model = yamlContent.match(CLAUDE_MODEL_RE)?.[1];
      }
      if (!model) {
        model = yamlContent.match(MODEL_INPUT_RE)?.[1];
      }

      const result: ProviderInfo = { name, action };
      if (model) result.model = model;
      return result;
    }
  }
  return undefined;
}
