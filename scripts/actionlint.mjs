import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createLinter } from "actionlint";

function isWorkflowFile(filename) {
  return filename.endsWith(".yml") || filename.endsWith(".yaml");
}

async function listWorkflowFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && isWorkflowFile(entry.name))
    .map((entry) => path.join(root, entry.name));
}

async function main() {
  const workflowsRoot = path.resolve(".github", "workflows");
  const workflowFiles = await listWorkflowFiles(workflowsRoot);
  const lint = await createLinter();
  let hasErrors = false;

  for (const file of workflowFiles) {
    const content = await readFile(file, "utf8");
    const results = lint(content, file);
    for (const result of results) {
      hasErrors = true;
      process.stderr.write(
        `${result.file}:${result.line}:${result.column}: ${result.message} [${result.kind}]\n`,
      );
    }
  }

  if (hasErrors) {
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`actionlint passed for ${workflowFiles.length} workflow file(s).\n`);
}

await main();
