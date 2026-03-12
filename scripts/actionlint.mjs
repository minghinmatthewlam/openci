import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createLinter } from "actionlint";

const workflowDir = path.join(process.cwd(), ".github", "workflows");

async function main() {
  const entries = await readdir(workflowDir);
  const workflowFiles = entries
    .filter((entry) => entry.endsWith(".yml") || entry.endsWith(".yaml"))
    .map((entry) => path.join(workflowDir, entry))
    .sort();

  if (workflowFiles.length === 0) {
    process.stdout.write("No workflow files found.\n");
    return;
  }

  const lint = await createLinter();
  let total = 0;

  for (const file of workflowFiles) {
    const input = await readFile(file, "utf8");
    const results = lint(input, file);

    for (const result of results) {
      total += 1;
      process.stderr.write(
        `${result.file}:${result.line}:${result.column} ${result.kind} ${result.message}\n`,
      );
    }
  }

  if (total > 0) {
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`Checked ${workflowFiles.length} workflow file(s).\n`);
}

await main();
