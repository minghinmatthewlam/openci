import type { Command } from "commander";
import { listInstallationMetadata } from "../manifest/store.js";
import { getGitRepoRoot } from "../utils/git.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List installed workflows")
    .action(async () => {
      const repoRoot = getGitRepoRoot(process.cwd());
      const workflows = await listInstallationMetadata(repoRoot);
      if (workflows.length === 0) {
        process.stdout.write("0 workflows installed.\n");
        return;
      }
      for (const w of workflows) {
        process.stdout.write(`${w.name}\t${w.source}\t${w.installedAt.slice(0, 10)}\n`);
      }
      process.stdout.write(`\n${workflows.length} workflow(s) installed.\n`);
    });
}
