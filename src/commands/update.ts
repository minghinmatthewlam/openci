import type { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { CliError } from "../core/errors.js";
import { detectRepo } from "../detection/index.js";
import { listInstallationMetadata, upsertInstallationMetadata } from "../manifest/store.js";
import { resolveSupportedProvider } from "../provider/resolve.js";
import { resolveWorkflowBundle } from "../registry/source.js";
import { resolveTemplateContext } from "../template/resolve.js";
import { substituteTemplate } from "../template/substitute.js";
import { getGitRepoRoot } from "../utils/git.js";

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
          let selectedProvider = resolveSupportedProvider(bundle.metadata, installation.provider);
          let selectedRuntime =
            installation.runtime ?? bundle.metadata.defaultRuntime ?? bundle.metadata.runtimes[0];
          let selectedRunner =
            installation.runner ?? bundle.metadata.defaultRunner ?? bundle.metadata.runners[0];
          let output = bundle.workflow;

          if (bundle.metadata.smart) {
            if (!bundle.workflowTemplate || !bundle.config) {
              throw new Error(
                `Workflow '${bundle.metadata.name}' is missing smart workflow files.`,
              );
            }

            const detected = await detectRepo(repoRoot, bundle.config.detect);
            const resolvedTemplate = resolveTemplateContext({
              metadata: bundle.metadata,
              config: bundle.config,
              detected,
              flags: {
                provider: installation.provider,
                runtime: installation.runtime,
                runner: installation.runner,
                model: installation.model,
                trigger: installation.trigger,
                branch: installation.branch,
              },
            });

            selectedProvider = resolvedTemplate.provider;
            selectedRuntime = resolvedTemplate.runtime;
            selectedRunner = resolvedTemplate.runner;
            output = substituteTemplate(bundle.workflowTemplate, resolvedTemplate.context);
          }

          if (!output) {
            throw new Error(`Workflow '${bundle.metadata.name}' could not be resolved.`);
          }

          await mkdir(dirname(targetPath), { recursive: true });
          await writeFile(targetPath, output, "utf8");
          await upsertInstallationMetadata(repoRoot, {
            ...installation,
            provider: selectedProvider,
            runtime: selectedRuntime,
            runner: selectedRunner,
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
