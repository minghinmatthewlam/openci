export interface ProviderInfo {
  name: string;
  action: string;
  model?: string;
}

const PROVIDER_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /uses:\s*(anthropics\/claude-code-action@[\w.-]+)/m, name: "Claude" },
  { pattern: /uses:\s*(anthropics\/claude-code-security-review@[\w.-]+)/m, name: "Claude" },
  { pattern: /uses:\s*(openai\/codex-action@[\w.-]+)/m, name: "Codex" },
  { pattern: /uses:\s*(google-github-actions\/run-gemini-cli@[\w.-]+)/m, name: "Gemini" },
];

const CLAUDE_MODEL_RE = /--model\s+([\w.-]+)/;
const MODEL_INPUT_RE = /model:\s*([\w.-]+)/m;

export function detectProvider(yamlContent: string): ProviderInfo | undefined {
  for (const { pattern, name } of PROVIDER_PATTERNS) {
    const actionMatch = yamlContent.match(pattern);
    if (actionMatch?.[1]) {
      let model: string | undefined;
      if (name === "Claude") {
        model = yamlContent.match(CLAUDE_MODEL_RE)?.[1];
      }
      if (!model) {
        model = yamlContent.match(MODEL_INPUT_RE)?.[1];
      }

      const result: ProviderInfo = { name, action: actionMatch[1] };
      if (model) result.model = model;
      return result;
    }
  }
  return undefined;
}
