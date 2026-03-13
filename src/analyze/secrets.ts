const SECRETS_RE = /\$\{\{\s*secrets\.(\w+)\s*\}\}/g;

export function extractSecrets(yamlContent: string): string[] {
  const secrets = new Set<string>();
  for (const match of yamlContent.matchAll(SECRETS_RE)) {
    if (match[1] && match[1] !== "GITHUB_TOKEN") {
      secrets.add(match[1]);
    }
  }
  return [...secrets].sort();
}
