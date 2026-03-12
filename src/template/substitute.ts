import { CliError } from "../core/errors.js";

const WHOLE_LINE_PLACEHOLDER_RE = /^(?<indent>[ \t]*){{\s*(?<name>[A-Z0-9_]+)\s*}}[ \t]*$/gm;
const INLINE_PLACEHOLDER_RE = /{{\s*([A-Z0-9_]+)\s*}}/g;

export function substituteTemplate(template: string, values: Record<string, string>): string {
  const missing = new Set<string>();

  const withWholeLineValues = template.replace(
    WHOLE_LINE_PLACEHOLDER_RE,
    (match, _indent, _name, _offset, _input, groups?: { indent?: string; name?: string }) => {
      const name = groups?.name;
      const indent = groups?.indent ?? "";

      if (!name || !(name in values)) {
        if (name) {
          missing.add(name);
        }

        return match;
      }

      const value = values[name];
      if (value === undefined) {
        missing.add(name);
        return match;
      }

      return value
        .split("\n")
        .map((line) => `${indent}${line}`)
        .join("\n");
    },
  );

  const rendered = withWholeLineValues.replace(INLINE_PLACEHOLDER_RE, (match, name: string) => {
    const value = values[name];
    if (value === undefined) {
      missing.add(name);
      return match;
    }

    return value;
  });

  if (missing.size > 0) {
    throw new CliError(`Unresolved placeholders: ${Array.from(missing).sort().join(", ")}`);
  }

  return rendered;
}
