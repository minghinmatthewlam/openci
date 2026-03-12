import type { Command } from "commander";
import { listInstallationMetadata } from "../manifest/store.js";
import { getGitRepoRoot } from "../utils/git.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List locally installed workflows")
    .action(async () => {
      const repoRoot = getGitRepoRoot(process.cwd());
      const workflows = await listInstallationMetadata(repoRoot);

      if (workflows.length === 0) {
        process.stdout.write("0 workflows installed.\n");
        return;
      }

      for (const workflow of workflows) {
        process.stdout.write(`${workflow.name}\t${workflow.provider}\t${workflow.source}\n`);
      }

      process.stdout.write(`\n${workflows.length} workflows installed.\n`);
    });
}
