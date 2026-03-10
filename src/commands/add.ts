import type { Command } from 'commander';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { detectRepo } from '../detection/index.js';
import { upsertManifestInstallation } from '../manifest/store.js';
import { resolveSupportedProvider } from '../provider/resolve.js';
import { resolveWorkflowBundle } from '../registry/source.js';
import { isGhAuthenticated, isGhAvailable } from '../secrets/check.js';
import { buildSecretInstructions } from '../secrets/prompt.js';
import { resolveTemplateContext } from '../template/resolve.js';
import { substituteTemplate } from '../template/substitute.js';
import { reportInstallEvent } from '../telemetry/report.js';
import { getGitRemoteUrl, getGitRepoRoot } from '../utils/git.js';
import { createLogger } from '../utils/logger.js';

function hasRawFlag(command: Command, flag: string): boolean {
  const rawArgs = (command.parent as Command & { rawArgs?: string[] } | undefined)?.rawArgs;
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
    .command('add')
    .description('Install a workflow into your repo')
    .argument('<source>')
    .option('--workflow <name>', 'Workflow to install from the source')
    .action(async (sourceArg: string, options: { workflow?: string }, command: Command) => {
      const globals = command.optsWithGlobals<{
        provider?: string;
        model?: string;
        trigger?: string;
        branch?: string;
        yes?: boolean;
        dryRun?: boolean;
        verbose?: boolean;
      }>();

      const explicitProvider = hasRawFlag(command, '--provider') ? globals.provider : undefined;
      const yes = Boolean(globals.yes);
      const dryRun = Boolean(globals.dryRun);
      const verbose = Boolean(globals.verbose);
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
        const targetPath = join(repoRoot, '.github', 'workflows', `${bundle.metadata.name}.yml`);

        let selectedProvider = resolveSupportedProvider(bundle.metadata, explicitProvider);
        let output = bundle.workflow;

        if (bundle.metadata.smart) {
          if (!bundle.workflowTemplate || !bundle.config) {
            throw new Error(`Workflow '${bundle.metadata.name}' is missing smart workflow files.`);
          }

          const detected = await detectRepo(repoRoot, bundle.config.detect);
          const resolved = resolveTemplateContext({
            metadata: bundle.metadata,
            config: bundle.config,
            detected,
            flags: {
              provider: explicitProvider,
              model: globals.model,
              trigger: globals.trigger,
              branch: globals.branch,
            },
          });

          selectedProvider = resolved.provider;
          output = substituteTemplate(bundle.workflowTemplate, resolved.context);

          if (verbose) {
            logger.debug(`Detected values: ${JSON.stringify(detected, null, 2)}`);
            logger.debug(`Resolved context: ${JSON.stringify(resolved.context, null, 2)}`);
          }
        } else {
          if (hasRawFlag(command, '--model')) {
            logger.warn(`Ignoring --model for basic workflow '${bundle.metadata.name}'.`);
          }
          if (hasRawFlag(command, '--trigger')) {
            logger.warn(`Ignoring --trigger for basic workflow '${bundle.metadata.name}'.`);
          }
          if (hasRawFlag(command, '--branch')) {
            logger.warn(`Ignoring --branch for basic workflow '${bundle.metadata.name}'.`);
          }
        }

        if (!output) {
          throw new Error(`Workflow '${bundle.metadata.name}' could not be resolved.`);
        }

        const targetExists = await fileExists(targetPath);
        if (targetExists) {
          logger.warn(`Overwriting existing workflow at ${targetPath}.`);
        }

        if (dryRun) {
          if (yes) {
            if (verbose) {
              logger.debug(`Dry run preview for ${targetPath}:\n${output}`);
            }
            logger.machineResult(targetPath);
          } else {
            process.stdout.write(`Would create ${targetPath}\n\n${output}\n`);
          }
        } else {
          await mkdir(dirname(targetPath), { recursive: true });
          await writeFile(targetPath, output, 'utf8');
          await upsertManifestInstallation(repoRoot, {
            name: bundle.metadata.name,
            source: bundle.sourceLabel,
            provider: selectedProvider,
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

          await reportInstallEvent({
            workflow: bundle.metadata.name,
            provider: selectedProvider,
            workflowVersion: bundle.metadata.version,
            installedAt: new Date().toISOString(),
          });
        }

        const ghReady = isGhAvailable() && isGhAuthenticated();
        for (const instruction of buildSecretInstructions(bundle.metadata, selectedProvider, remoteUrl, ghReady)) {
          logger.warn(instruction);
        }
      } finally {
        await resolvedSource.cleanup?.();
      }
    });
}
