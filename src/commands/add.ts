import type { Command } from "commander";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { upsertInstallationMetadata } from "../manifest/store.js";
import { resolveWorkflowBundle } from "../registry/source.js";
import { isGhAuthenticated, isGhAvailable } from "../secrets/check.js";
import { buildSecretInstructions } from "../secrets/prompt.js";
import { atomicWrite } from "../utils/atomic-write.js";
import { getGitRemoteUrl, getGitRepoRoot } from "../utils/git.js";
import { createLogger } from "../utils/logger.js";
import { renderWorkflow } from "./render-workflow.js";

function hasRawFlag(command: Command, flag: string): boolean {
  const rawArgs = (command.parent as (Command & { rawArgs?: string[] }) | undefined)?.rawArgs;
  return rawArgs?.includes(flag) ?? false;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description("Install a workflow into your repo")
    .argument("<source>")
    .option("--provider <name>", "Provider override")
    .option("--runtime <name>", "Runtime override: action, script")
    .option("--runner <name>", "Runner override")
    .option("--model <name>", "Model override")
    .option("--trigger <event>", "Workflow trigger override")
    .option("--branch <name>", "Target branch override")
    .option("--yes", "Non-interactive mode")
    .option("--dry-run", "Show what would be installed without writing files")
    .option("--verbose", "Show detection and substitution details")
    .option("--workflow <name>", "Workflow to install from the source")
    .action(
      async (
        sourceArg: string,
        options: {
          workflow?: string;
          provider?: string;
          runtime?: "action" | "script";
          runner?: string;
          model?: string;
          trigger?: string;
          branch?: string;
          yes?: boolean;
          dryRun?: boolean;
          verbose?: boolean;
        },
        command: Command,
      ) => {
        const commandOptions = command.opts<{
          provider?: string;
          runtime?: "action" | "script";
          runner?: string;
          model?: string;
          trigger?: string;
          branch?: string;
          yes?: boolean;
          dryRun?: boolean;
          verbose?: boolean;
        }>();

        const explicitProvider = hasRawFlag(command, "--provider")
          ? commandOptions.provider
          : undefined;
        const yes = Boolean(commandOptions.yes);
        const dryRun = Boolean(commandOptions.dryRun);
        const verbose = Boolean(commandOptions.verbose);
        const logger = createLogger({ yes, verbose });
        const cwd = process.cwd();
        const repoRoot = getGitRepoRoot(cwd);
        const remoteUrl = getGitRemoteUrl(repoRoot);
        const resolvedSource = await resolveWorkflowBundle({
          cwd,
          sourceArg,
          workflow: options.workflow,
        });

        try {
          const { bundle } = resolvedSource;
          const targetPath = join(repoRoot, ".github", "workflows", `${bundle.metadata.name}.yml`);

          // Warn about ignored flags on non-smart workflows
          if (!bundle.metadata.smart) {
            for (const flag of ["--runtime", "--runner", "--model", "--trigger", "--branch"]) {
              if (hasRawFlag(command, flag)) {
                logger.warn(
                  `Ignoring ${flag} for copied-as-is workflow '${bundle.metadata.name}'.`,
                );
              }
            }
          }

          const result = await renderWorkflow(bundle, repoRoot, {
            provider: explicitProvider,
            runtime: commandOptions.runtime,
            runner: commandOptions.runner,
            model: commandOptions.model,
            trigger: commandOptions.trigger,
            branch: commandOptions.branch,
          });

          if (verbose && result.detected) {
            logger.debug(`Detected values: ${JSON.stringify(result.detected, null, 2)}`);
            logger.debug(`Resolved context: ${JSON.stringify(result.context, null, 2)}`);
          }

          const targetExists = await fileExists(targetPath);
          if (targetExists) {
            logger.warn(`Overwriting existing workflow at ${targetPath}.`);
          }

          if (dryRun) {
            if (yes) {
              if (verbose) {
                logger.debug(`Dry run preview for ${targetPath}:\n${result.output}`);
              }
              logger.machineResult(targetPath);
            } else {
              process.stdout.write(`Would create ${targetPath}\n\n${result.output}\n`);
            }
          } else {
            await atomicWrite(targetPath, result.output);
            await upsertInstallationMetadata(repoRoot, {
              name: bundle.metadata.name,
              source: bundle.sourceLabel,
              provider: result.provider,
              runtime: result.runtime,
              runner: result.runner,
              model: commandOptions.model,
              trigger: commandOptions.trigger,
              branch: commandOptions.branch,
              smart: bundle.metadata.smart,
              workflowVersion: bundle.metadata.version,
              targetPath,
              installedAt: new Date().toISOString(),
            });

            if (yes) {
              logger.machineResult(targetPath);
            } else {
              process.stdout.write(`Created ${targetPath}\n`);
            }
          }

          if (result.provider) {
            const ghReady = isGhAvailable() && isGhAuthenticated();
            for (const instruction of buildSecretInstructions(
              bundle.metadata,
              result.provider,
              remoteUrl,
              ghReady,
            )) {
              logger.warn(instruction);
            }
          }
        } finally {
          await resolvedSource.cleanup?.();
        }
      },
    );
}
