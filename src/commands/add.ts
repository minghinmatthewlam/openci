import type { Command } from "commander";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  detectProvider,
  extractPermissions,
  extractSecrets,
  extractTriggers,
  findConflicts,
  hasTimeout,
} from "../analyze/index.js";
import { CliError } from "../core/errors.js";
import { upsertInstallationMetadata } from "../manifest/store.js";
import { fetchWorkflowFile, listAvailableWorkflows } from "../registry/source.js";
import { isGhReady } from "../secrets/check.js";
import { buildSecretInstructions } from "../secrets/prompt.js";
import { atomicWrite } from "../utils/atomic-write.js";
import { getGitRemoteUrl, getGitRepoRoot } from "../utils/git.js";
import { createLogger } from "../utils/logger.js";
import { isWorkflowFile, stemName } from "../utils/workflow.js";

async function fileExists(filepath: string): Promise<boolean> {
  try {
    await access(filepath);
    return true;
  } catch {
    return false;
  }
}

async function getExistingWorkflowTriggers(
  repoRoot: string,
): Promise<Array<{ name: string; triggers: ReturnType<typeof extractTriggers> }>> {
  const dir = join(repoRoot, ".github", "workflows");
  try {
    const files = (await readdir(dir)).filter(isWorkflowFile);
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const content = await readFile(join(dir, file), "utf8");
          return { name: stemName(file), triggers: extractTriggers(content) };
        } catch {
          return undefined;
        }
      }),
    );
    return results.filter((r): r is NonNullable<typeof r> => r !== undefined);
  } catch {
    return [];
  }
}

export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description("Install a workflow from any repo")
    .argument("<source>", "Source: owner/repo, git URL, or local path")
    .option("--workflow <name>", "Workflow to install (omit to list available)")
    .option("--force", "Overwrite existing workflow file")
    .option("--yes", "Non-interactive mode")
    .option("--dry-run", "Show what would be installed without writing")
    .option("--verbose", "Show additional details")
    .action(
      async (
        sourceArg: string,
        options: {
          workflow?: string;
          force?: boolean;
          yes?: boolean;
          dryRun?: boolean;
          verbose?: boolean;
        },
      ) => {
        const yes = Boolean(options.yes);
        const dryRun = Boolean(options.dryRun);
        const verbose = Boolean(options.verbose);
        const logger = createLogger({ yes, verbose });
        const cwd = process.cwd();
        const repoRoot = getGitRepoRoot(cwd);

        // List mode: no --workflow specified
        if (!options.workflow) {
          const result = await listAvailableWorkflows({ cwd, sourceArg });
          try {
            if (result.workflows.length === 0) {
              throw new CliError(
                `No workflows found in ${sourceArg}. The repo may not have a .github/workflows/ directory.`,
              );
            }
            process.stdout.write(`Available workflows in ${sourceArg}:\n\n`);
            for (const w of result.workflows) {
              process.stdout.write(
                `  ${w.name.padEnd(30)} openci add ${sourceArg} --workflow ${w.name}\n`,
              );
            }
            process.stdout.write(`\n${result.workflows.length} workflow(s) found.\n`);
          } finally {
            await result.cleanup?.();
          }
          return;
        }

        // Install mode
        const resolved = await fetchWorkflowFile({
          cwd,
          sourceArg,
          workflow: options.workflow,
        });
        try {
          const { file } = resolved;
          const targetPath = join(repoRoot, ".github", "workflows", file.filename);

          if (await fileExists(targetPath)) {
            if (!options.force) {
              throw new CliError(`${file.filename} already exists. Use --force to overwrite.`);
            }
            logger.warn(`Overwriting existing ${file.filename}`);
          }

          if (dryRun) {
            process.stdout.write(`Would install ${file.filename} from ${file.source}\n`);
          } else {
            await atomicWrite(targetPath, file.content);
            await upsertInstallationMetadata(repoRoot, {
              name: file.name,
              source: file.source,
              workflow: file.name,
              commit: file.commit,
              contentHash: file.contentHash,
              targetPath,
              installedAt: new Date().toISOString(),
            });
            if (yes) {
              process.stdout.write(`${targetPath}\n`);
            } else {
              process.stdout.write(`Installed ${file.filename}\n`);
            }
          }

          // Post-install intelligence
          if (!yes || verbose) {
            const provider = detectProvider(file.content);
            const secrets = extractSecrets(file.content);
            const permissions = extractPermissions(file.content);
            const timeout = hasTimeout(file.content);
            const triggers = extractTriggers(file.content);

            const lines: string[] = [""];
            if (provider) {
              lines.push(`  Provider:     ${provider.name} (${provider.action})`);
              if (provider.model) lines.push(`  Model:        ${provider.model}`);
            }
            if (triggers.length > 0) {
              lines.push(`  Triggers:     ${triggers.map((t) => t.event).join(", ")}`);
            }
            const permEntries = Object.entries(permissions);
            if (permEntries.length > 0) {
              lines.push(`  Permissions:  ${permEntries.map(([k, v]) => `${k}: ${v}`).join(", ")}`);
            }
            if (!timeout) {
              lines.push(`  Warning:      No timeout-minutes set (GitHub default: 6 hours)`);
            }

            const existing = await getExistingWorkflowTriggers(repoRoot);
            const conflicts = findConflicts(
              triggers,
              existing.filter((e) => e.name !== file.name),
            );
            for (const conflict of conflicts) {
              lines.push(`  Conflict:     ${conflict}`);
            }

            if (lines.length > 1) {
              for (const line of lines) process.stdout.write(`${line}\n`);
            }

            if (secrets.length > 0 && !dryRun) {
              const remoteUrl = getGitRemoteUrl(repoRoot);
              const instructions = buildSecretInstructions(secrets, remoteUrl, isGhReady());
              process.stdout.write("\n");
              for (const instruction of instructions) {
                logger.warn(instruction);
              }
            }
          }
        } finally {
          await resolved.cleanup?.();
        }
      },
    );
}
