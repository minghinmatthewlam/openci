import type { Command } from "commander";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CliError } from "../core/errors.js";
import { listInstallationMetadata, upsertInstallationMetadata } from "../manifest/store.js";
import { fetchWorkflowFile } from "../registry/source.js";
import { atomicWrite } from "../utils/atomic-write.js";
import { getGitRepoRoot } from "../utils/git.js";

export function registerUpdateCommand(program: Command): void {
  program
    .command("update")
    .description("Update installed workflows from their source")
    .argument("[workflows...]", "Specific workflows to update")
    .option("--force", "Overwrite even if locally modified")
    .action(async (workflowNames: string[] = [], options: { force?: boolean }) => {
      const repoRoot = getGitRepoRoot(process.cwd());
      const installations = await listInstallationMetadata(repoRoot);

      if (installations.length === 0) {
        process.stdout.write("0 workflows installed.\n");
        return;
      }

      const selected =
        workflowNames.length > 0
          ? installations.filter((i) => workflowNames.includes(i.name))
          : installations;

      if (selected.length === 0) {
        throw new CliError(`No installed workflows matched: ${workflowNames.join(", ")}`);
      }

      const failures: Array<{ name: string; message: string }> = [];

      for (const installation of selected) {
        let resolved: Awaited<ReturnType<typeof fetchWorkflowFile>> | undefined;
        try {
          resolved = await fetchWorkflowFile({
            cwd: repoRoot,
            sourceArg: installation.source,
            workflow: installation.workflow,
          });

          const { file } = resolved;
          const targetPath = join(repoRoot, installation.targetPath);

          // Check if local file was modified
          let localContent: string;
          try {
            localContent = await readFile(targetPath, "utf8");
          } catch {
            // File missing — just write it
            await atomicWrite(targetPath, file.content);
            await upsertInstallationMetadata(repoRoot, {
              ...installation,
              commit: file.commit,
              contentHash: file.contentHash,
              targetPath,
              installedAt: installation.installedAt,
            });
            process.stdout.write(`${installation.name}\trestored\n`);
            continue;
          }

          const localHash = createHash("sha256").update(localContent).digest("hex");

          // Check if upstream changed
          if (localHash === file.contentHash) {
            process.stdout.write(`${installation.name}\tup-to-date\n`);
            continue;
          }

          // Check for local modifications
          if (
            installation.contentHash &&
            localHash !== installation.contentHash &&
            !options.force
          ) {
            process.stderr.write(
              `${installation.name}\tskipped (locally modified, use --force to overwrite)\n`,
            );
            continue;
          }

          await atomicWrite(targetPath, file.content);
          await upsertInstallationMetadata(repoRoot, {
            ...installation,
            commit: file.commit,
            contentHash: file.contentHash,
            targetPath,
            installedAt: installation.installedAt,
          });
          process.stdout.write(`${installation.name}\tupdated\n`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push({ name: installation.name, message });
          process.stderr.write(`${installation.name}\tfailed\t${message}\n`);
        } finally {
          await resolved?.cleanup?.();
        }
      }

      if (failures.length > 0) {
        throw new CliError(
          `Failed to update ${failures.length} workflow(s): ${failures.map((f) => f.name).join(", ")}`,
        );
      }
    });
}
