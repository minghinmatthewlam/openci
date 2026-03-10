import type { Command } from 'commander';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { detectRepo } from '../detection/index.js';
import { listInstallationMetadata, upsertInstallationMetadata } from '../manifest/store.js';
import { resolveSupportedProvider } from '../provider/resolve.js';
import { resolveWorkflowBundle } from '../registry/source.js';
import { resolveTemplateContext } from '../template/resolve.js';
import { substituteTemplate } from '../template/substitute.js';
import { getGitRepoRoot } from '../utils/git.js';

export function registerUpdateCommand(program: Command): void {
  program
    .command('update')
    .description('Update installed workflows from their source metadata')
    .argument('[workflows...]')
    .action(async (workflowNames: string[] = []) => {
      const repoRoot = getGitRepoRoot(process.cwd());
      const installations = await listInstallationMetadata(repoRoot);

      if (installations.length === 0) {
        process.stdout.write('0 workflows installed.\n');
        return;
      }

      const selected = workflowNames.length > 0
        ? installations.filter((installation) => workflowNames.includes(installation.name))
        : installations;

      if (selected.length === 0) {
        process.stdout.write('0 matching workflows installed.\n');
        return;
      }

      for (const installation of selected) {
        const resolved = await resolveWorkflowBundle({
          cwd: repoRoot,
          sourceArg: installation.source,
          workflow: installation.name,
        });

        try {
          const { bundle } = resolved;
          const targetPath = join(repoRoot, installation.targetPath);
          let selectedProvider = resolveSupportedProvider(bundle.metadata, installation.provider);
          let output = bundle.workflow;

          if (bundle.metadata.smart) {
            if (!bundle.workflowTemplate || !bundle.config) {
              throw new Error(`Workflow '${bundle.metadata.name}' is missing smart workflow files.`);
            }

            const detected = await detectRepo(repoRoot, bundle.config.detect);
            const resolvedTemplate = resolveTemplateContext({
              metadata: bundle.metadata,
              config: bundle.config,
              detected,
              flags: {
                provider: installation.provider,
                model: installation.model,
                trigger: installation.trigger,
                branch: installation.branch,
              },
            });

            selectedProvider = resolvedTemplate.provider;
            output = substituteTemplate(bundle.workflowTemplate, resolvedTemplate.context);
          }

          if (!output) {
            throw new Error(`Workflow '${bundle.metadata.name}' could not be resolved.`);
          }

          await mkdir(dirname(targetPath), { recursive: true });
          await writeFile(targetPath, output, 'utf8');
          await upsertInstallationMetadata(repoRoot, {
            ...installation,
            provider: selectedProvider,
            workflowVersion: bundle.metadata.version,
            targetPath,
            installedAt: new Date().toISOString(),
          });

          process.stdout.write(`${bundle.metadata.name}\tupdated\n`);
        } finally {
          await resolved.cleanup?.();
        }
      }
    });
}
