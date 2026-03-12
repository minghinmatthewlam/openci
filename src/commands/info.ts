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
      process.stdout.write(
        `Providers: ${metadata.provider.length > 0 ? metadata.provider.join(", ") : "none"}\n`,
      );
      process.stdout.write(
        `Runtimes: ${metadata.runtimes.length > 0 ? metadata.runtimes.join(", ") : "none"}\n`,
      );
      process.stdout.write(
        `Runners: ${metadata.runners.length > 0 ? metadata.runners.join(", ") : "none"}\n`,
      );
      if (metadata.defaultRuntime) {
        process.stdout.write(`Default runtime: ${metadata.defaultRuntime}\n`);
      }
      if (metadata.defaultRunner) {
        process.stdout.write(`Default runner: ${metadata.defaultRunner}\n`);
      }
      process.stdout.write(`Triggers: ${metadata.triggers.join(", ")}\n`);
      process.stdout.write(`Tags: ${metadata.tags.join(", ")}\n`);
      if (Object.keys(metadata.requiredSecrets).length === 0) {
        process.stdout.write("Required secrets: none\n");
      } else {
        process.stdout.write("Required secrets:\n");
        for (const [provider, secrets] of Object.entries(metadata.requiredSecrets)) {
          process.stdout.write(`  ${provider}: ${secrets.join(", ")}\n`);
        }
      }

      process.stdout.write(`\n${readme.trim()}\n`);
    });
}
