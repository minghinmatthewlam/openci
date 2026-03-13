export interface TriggerInfo {
  event: string;
}

export function extractTriggers(yamlContent: string): TriggerInfo[] {
  const triggers: TriggerInfo[] = [];
  const lines = yamlContent.split("\n");
  let inOn = false;
  let onIndent = 0;

  for (const line of lines) {
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (trimmed.startsWith("on:")) {
      inOn = true;
      onIndent = indent;
      const inline = trimmed.slice("on:".length).trim();
      if (inline) {
        const events = inline
          .replace(/[[\]]/g, "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        for (const event of events) {
          triggers.push({ event });
        }
        inOn = false;
      }
      continue;
    }

    if (inOn) {
      if (trimmed === "" || trimmed.startsWith("#")) continue;
      if (indent <= onIndent) {
        inOn = false;
        continue;
      }
      const eventMatch = trimmed.match(/^([\w_]+):/);
      if (eventMatch?.[1] && indent === onIndent + 2) {
        triggers.push({ event: eventMatch[1] });
      }
    }
  }

  return triggers;
}

export function findConflicts(
  newTriggers: TriggerInfo[],
  existing: Array<{ name: string; triggers: TriggerInfo[] }>,
): string[] {
  const warnings: string[] = [];
  const newEvents = new Set(newTriggers.map((t) => t.event));

  for (const workflow of existing) {
    const overlap = workflow.triggers.filter((t) => newEvents.has(t.event));
    if (overlap.length > 0) {
      const events = overlap.map((t) => t.event).join(", ");
      warnings.push(`Overlaps with '${workflow.name}' on: ${events}`);
    }
  }

  return warnings;
}
