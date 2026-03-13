import type { Command } from "commander";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { listInstallationMetadata } from "../manifest/store.js";
import { getGitRepoRoot } from "../utils/git.js";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Show installed workflows and their health")
    .action(async () => {
      const repoRoot = getGitRepoRoot(process.cwd());
      const installations = await listInstallationMetadata(repoRoot);
      const workflowsDir = join(repoRoot, ".github", "workflows");

      let workflowFiles: string[] = [];
      try {
        workflowFiles = (await readdir(workflowsDir))
          .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
          .map((f) => join(".github", "workflows", f));
      } catch {
        workflowFiles = [];
      }

      process.stdout.write("name\tsource\tfile\tstatus\n");

      const trackedFiles = new Set(installations.map((i) => i.targetPath));

      for (const installation of installations) {
        const status = workflowFiles.includes(installation.targetPath)
          ? "installed"
          : "missing-file";
        process.stdout.write(
          `${installation.name}\t${installation.source}\t${installation.targetPath}\t${status}\n`,
        );
      }

      for (const file of workflowFiles) {
        if (!trackedFiles.has(file)) {
          const name = file.replace(/^\.github\/workflows\//, "").replace(/\.ya?ml$/, "");
          process.stdout.write(`${name}\tunknown\t${file}\tuntracked\n`);
        }
      }
    });
}
