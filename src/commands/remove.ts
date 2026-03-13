import type { Command } from "commander";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unlink } from "node:fs/promises";
import { CliError } from "../core/errors.js";
import { extractSecrets } from "../analyze/index.js";
import {
  deleteInstallationMetadata,
  listInstallationMetadata,
  readInstallationMetadata,
} from "../manifest/store.js";
import { getGitRepoRoot } from "../utils/git.js";

export function registerRemoveCommand(program: Command): void {
  program
    .command("remove")
    .description("Remove an installed workflow")
    .argument("<name>", "Workflow name to remove")
    .action(async (name: string) => {
      const repoRoot = getGitRepoRoot(process.cwd());
      const installation = await readInstallationMetadata(repoRoot, name);

      if (!installation) {
        throw new CliError(`Workflow '${name}' is not installed.`);
      }

      const targetPath = join(repoRoot, installation.targetPath);

      // Read the workflow content before deleting to analyze secrets
      let removedSecrets: string[] = [];
      try {
        const content = await readFile(targetPath, "utf8");
        removedSecrets = extractSecrets(content);
      } catch {
        /* file may already be missing */
      }

      // Delete workflow file
      try {
        await unlink(targetPath);
      } catch {
        /* already gone */
      }

      // Delete sidecar
      await deleteInstallationMetadata(repoRoot, name);

      process.stdout.write(`Removed ${name}\n`);

      // Cross-reference secrets
      if (removedSecrets.length > 0) {
        const remaining = await listInstallationMetadata(repoRoot);
        const allRemainingSecrets = new Set<string>();
        for (const r of remaining) {
          try {
            const content = await readFile(join(repoRoot, r.targetPath), "utf8");
            for (const s of extractSecrets(content)) allRemainingSecrets.add(s);
          } catch {
            /* skip */
          }
        }

        const orphaned = removedSecrets.filter((s) => !allRemainingSecrets.has(s));
        if (orphaned.length > 0) {
          process.stdout.write(`\nSecrets that may no longer be needed:\n`);
          for (const s of orphaned) {
            process.stdout.write(`  ${s}\n`);
          }
        }

        const stillUsed = removedSecrets.filter((s) => allRemainingSecrets.has(s));
        if (stillUsed.length > 0) {
          process.stdout.write(`\nSecrets still used by other workflows:\n`);
          for (const s of stillUsed) {
            process.stdout.write(`  ${s}\n`);
          }
        }
      }
    });
}
