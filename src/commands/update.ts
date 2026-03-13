import type { Command } from "commander";
import { join } from "node:path";
import { CliError } from "../core/errors.js";
import { listInstallationMetadata, upsertInstallationMetadata } from "../manifest/store.js";
import { resolveWorkflowBundle } from "../registry/source.js";
import { atomicWrite } from "../utils/atomic-write.js";
import { getGitRepoRoot } from "../utils/git.js";
import { renderWorkflow } from "./render-workflow.js";

export function registerUpdateCommand(program: Command): void {
  program
    .command("update")
    .description("Update installed workflows from their source metadata")
    .argument("[workflows...]")
    .action(async (workflowNames: string[] = []) => {
      const repoRoot = getGitRepoRoot(process.cwd());
      const installations = await listInstallationMetadata(repoRoot);

      if (installations.length === 0) {
        process.stdout.write("0 workflows installed.\n");
        return;
      }

      const selected =
        workflowNames.length > 0
          ? installations.filter((installation) => workflowNames.includes(installation.name))
          : installations;

      if (selected.length === 0) {
        throw new CliError(`No installed workflows matched: ${workflowNames.join(", ")}`);
      }

      const failures: Array<{ name: string; message: string }> = [];

      for (const installation of selected) {
        let resolved: Awaited<ReturnType<typeof resolveWorkflowBundle>> | undefined;

        try {
          resolved = await resolveWorkflowBundle({
            cwd: repoRoot,
            sourceArg: installation.source,
            workflow: installation.name,
          });

          const { bundle } = resolved;
          const targetPath = join(repoRoot, installation.targetPath);

          const result = await renderWorkflow(bundle, repoRoot, {
            provider: installation.provider,
            runtime: installation.runtime,
            runner: installation.runner,
            model: installation.model,
            trigger: installation.trigger,
            branch: installation.branch,
          });

          await atomicWrite(targetPath, result.output);
          await upsertInstallationMetadata(repoRoot, {
            ...installation,
            provider: result.provider,
            runtime: result.runtime,
            runner: result.runner,
            workflowVersion: bundle.metadata.version,
            targetPath,
            installedAt: new Date().toISOString(),
          });

          process.stdout.write(`${bundle.metadata.name}\tupdated\n`);
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
          `Failed to update ${failures.length} workflow(s): ${failures.map((failure) => failure.name).join(", ")}`,
        );
      }
    });
}
