import type { Command } from "commander";
import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { CliError } from "../core/errors.js";
import { extractSecrets } from "../analyze/index.js";
import type { Installation } from "../manifest/schema.js";
import {
  deleteInstallationMetadata,
  listInstallationMetadata,
  readInstallationMetadata,
} from "../manifest/store.js";
import { getGitRepoRoot } from "../utils/git.js";

async function getInstallationSecrets(
  repoRoot: string,
  installation: Installation,
): Promise<string[]> {
  try {
    const content = await readFile(join(repoRoot, installation.targetPath), "utf8");
    return extractSecrets(content);
  } catch {
    return installation.requiredSecrets ?? [];
  }
}

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
      const removedSecrets = await getInstallationSecrets(repoRoot, installation);

      try {
        await unlink(targetPath);
      } catch {
        /* already gone */
      }

      await deleteInstallationMetadata(repoRoot, name);

      process.stdout.write(`Removed ${name}\n`);

      if (removedSecrets.length > 0) {
        const remaining = await listInstallationMetadata(repoRoot);
        const secretSets = await Promise.all(
          remaining.map((r) => getInstallationSecrets(repoRoot, r)),
        );
        const allRemainingSecrets = new Set(secretSets.flat());

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
