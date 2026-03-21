import { spawnSync } from "node:child_process";
import { SearchResponseSchema } from "@matthewlam/openci-contracts";

const query = process.argv[2] ?? "triage";
const result = spawnSync(process.execPath, ["dist/index.js", "search", query, "--json"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.status !== 0) {
  process.stderr.write(result.stderr || `search smoke failed with exit code ${result.status}\n`);
  process.exit(result.status ?? 1);
}

let parsed;
try {
  parsed = SearchResponseSchema.parse(JSON.parse(result.stdout));
} catch (error) {
  process.stderr.write(
    `search smoke returned invalid JSON/schema: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}

if (parsed.query !== query) {
  process.stderr.write(`search smoke query mismatch: expected '${query}', got '${parsed.query}'\n`);
  process.exit(1);
}

if (!Number.isInteger(parsed.count) || parsed.count < 0) {
  process.stderr.write(`search smoke count must be a non-negative integer, got ${parsed.count}\n`);
  process.exit(1);
}

if (!Array.isArray(parsed.results)) {
  process.stderr.write("search smoke results must be an array\n");
  process.exit(1);
}

for (const [index, workflow] of parsed.results.entries()) {
  const missing = [
    ["source", workflow.source],
    ["workflow", workflow.workflow],
    ["title", workflow.title],
    ["summary", workflow.summary],
    ["provider", workflow.provider],
    ["stars", workflow.stars],
    ["installs", workflow.installs],
    ["curated", workflow.curated],
  ].filter(([, value]) => value === undefined || value === null || value === "");

  if (missing.length > 0) {
    process.stderr.write(
      `search smoke result ${index} is missing required fields: ${missing.map(([name]) => name).join(", ")}\n`,
    );
    process.exit(1);
  }
}

process.stdout.write(
  `search live smoke passed for '${query}' with ${parsed.count} result(s) from the hosted API.\n`,
);
