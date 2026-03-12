import type { Command } from "commander";
import { CliError } from "../core/errors.js";
import {
  fetchOfficialWorkflowMetadata,
  fetchOfficialWorkflowReadme,
  findRegistryWorkflowByName,
} from "../registry/resolve.js";

export function registerInfoCommand(program: Command): void {
  program
    .command("info")
    .description("Show details about a specific workflow")
    .argument("<workflow>")
    .action(async (workflowName: string) => {
      const workflow = await findRegistryWorkflowByName(workflowName);
      if (!workflow) {
        throw new CliError(
          `Workflow '${workflowName}' not found. Run \`openci search\` to browse.`,
        );
      }

      const [metadata, readme] = await Promise.all([
        fetchOfficialWorkflowMetadata(workflowName),
        fetchOfficialWorkflowReadme(workflowName),
      ]);

      process.stdout.write(`${metadata.displayName}\n`);
      process.stdout.write(`${metadata.description}\n\n`);
      process.stdout.write(`Type: ${metadata.smart ? "smart workflow" : "workflow"}\n`);
      process.stdout.write(`Providers: ${metadata.provider.join(", ")}\n`);
      process.stdout.write(`Triggers: ${metadata.triggers.join(", ")}\n`);
      process.stdout.write(`Tags: ${metadata.tags.join(", ")}\n`);
      process.stdout.write("Required secrets:\n");

      for (const [provider, secrets] of Object.entries(metadata.requiredSecrets)) {
        process.stdout.write(`  ${provider}: ${secrets.join(", ")}\n`);
      }

      process.stdout.write(`\n${readme.trim()}\n`);
    });
}
