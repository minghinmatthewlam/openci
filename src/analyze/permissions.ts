export function extractPermissions(yamlContent: string): Record<string, string> {
  const permissions: Record<string, string> = {};
  const lines = yamlContent.split("\n");
  let inPermissions = false;
  let baseIndent = 0;

  for (const line of lines) {
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (trimmed.startsWith("permissions:")) {
      // Check for inline permissions: read-all / write-all
      const inlineValue = trimmed.slice("permissions:".length).trim();
      if (inlineValue) {
        permissions["_global"] = inlineValue;
        break;
      }
      inPermissions = true;
      baseIndent = indent;
      continue;
    }

    if (inPermissions) {
      if (trimmed === "" || trimmed.startsWith("#")) continue;
      if (indent <= baseIndent) break;
      const match = trimmed.match(/^([\w-]+):\s*(\w+)/);
      if (match && match[1] && match[2]) {
        permissions[match[1]] = match[2];
      }
    }
  }

  return permissions;
}
