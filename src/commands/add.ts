import type { Command } from "commander";
import { access, readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  detectProvider,
  extractPermissions,
  extractSecrets,
  extractTriggers,
  findConflicts,
  hasTimeout,
} from "../analyze/index.js";
import { CliError } from "../core/errors.js";
import {
  getGitHubRepoVisibility,
  buildWorkflowSlug,
  parseGitHubRepoRef,
} from "../github/identity.js";
import { upsertInstallationMetadata } from "../manifest/store.js";
import {
  fetchWorkflowFile,
  listAvailableWorkflows,
  type WorkflowFile,
} from "../registry/source.js";
import { isGhReady } from "../secrets/check.js";
import { buildSecretInstructions } from "../secrets/prompt.js";
import { getRepoSecretAccess, setRepoSecret, tryListRepoSecrets } from "../secrets/repo.js";
import { trackInstallSuccess } from "../telemetry/client.js";
import { atomicWrite } from "../utils/atomic-write.js";
import { getGitRemoteUrl, getGitRepoRoot } from "../utils/git.js";
import { createLogger } from "../utils/logger.js";
import { isWorkflowFile, stemName } from "../utils/workflow.js";
import { CLI_VERSION } from "../version.js";

interface AddOptions {
  workflow?: string;
  force?: boolean;
  yes?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  setup?: boolean;
  copyEnv?: string[];
  secret?: string[];
  allFromEnv?: boolean;
  json?: boolean;
}

type SetupStatus = "not_requested" | "configured" | "incomplete" | "unavailable";

interface SetupResult {
  attempted: boolean;
  status: SetupStatus;
  requiredSecrets: string[];
  configuredSecrets: string[];
  missingSecrets: string[];
  nextCommand: string | null;
}

function collectValues(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

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
    return results.filter((result): result is NonNullable<typeof result> => result !== undefined);
  } catch {
    return [];
  }
}

function hasSetupRequest(options: AddOptions): boolean {
  return (
    Boolean(options.setup) ||
    Boolean(options.allFromEnv) ||
    (options.copyEnv?.length ?? 0) > 0 ||
    (options.secret?.length ?? 0) > 0
  );
}

function hasSetupValueInputs(options: AddOptions): boolean {
  return (
    Boolean(options.allFromEnv) ||
    (options.copyEnv?.length ?? 0) > 0 ||
    (options.secret?.length ?? 0) > 0
  );
}

function parseSecretAssignments(values: string[]): Map<string, string> {
  const parsed = new Map<string, string>();
  for (const value of values) {
    const index = value.indexOf("=");
    if (index <= 0) {
      throw new CliError(`Invalid --secret value '${value}'. Use NAME=value.`);
    }
    const name = value.slice(0, index).trim();
    if (!name) {
      throw new CliError(`Invalid --secret value '${value}'. Use NAME=value.`);
    }
    parsed.set(name, value.slice(index + 1));
  }
  return parsed;
}

function resolveSecretValues(missingSecrets: string[], options: AddOptions): Map<string, string> {
  const resolved = new Map<string, string>();
  const explicit = parseSecretAssignments(options.secret ?? []);
  const copyEnv = new Set(options.copyEnv ?? []);

  for (const secret of missingSecrets) {
    if (explicit.has(secret)) {
      resolved.set(secret, explicit.get(secret)!);
      continue;
    }

    if (copyEnv.has(secret) && typeof process.env[secret] === "string" && process.env[secret]) {
      resolved.set(secret, process.env[secret]!);
      continue;
    }

    if (options.allFromEnv && typeof process.env[secret] === "string" && process.env[secret]) {
      resolved.set(secret, process.env[secret]!);
    }
  }

  return resolved;
}

function quoteArg(value: string): string {
  return /^[A-Za-z0-9_./:@=-]+$/.test(value) ? value : JSON.stringify(value);
}

function buildSetupNextCommand(
  source: string,
  workflow: string,
  missingSecrets: string[],
): string | null {
  if (missingSecrets.length === 0) return null;
  const args = [
    "openci",
    "add",
    quoteArg(source),
    "--workflow",
    quoteArg(workflow),
    "--setup",
    ...missingSecrets.flatMap((secret) => ["--copy-env", secret]),
  ];
  return args.join(" ");
}

function writeJson(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

async function maybeTrackInstall(
  file: WorkflowFile,
  repoRoot: string,
): Promise<string | undefined> {
  const slug = buildWorkflowSlug(file.source, file.name);
  if (!slug) return undefined;

  const sourceRepo = parseGitHubRepoRef(file.source);
  if (!sourceRepo) return slug;

  const sourceVisibility = await getGitHubRepoVisibility(sourceRepo);
  if (sourceVisibility !== "public") return slug;

  await trackInstallSuccess({
    slug,
    repoRoot,
    cliVersion: CLI_VERSION,
  });

  return slug;
}

async function emitHumanAnalysis(
  file: WorkflowFile,
  repoRoot: string,
  options: { showSecretInstructions: boolean },
  logger: ReturnType<typeof createLogger>,
): Promise<string[]> {
  const provider = detectProvider(file.content);
  const secrets = extractSecrets(file.content);
  const permissions = extractPermissions(file.content);
  const timeout = hasTimeout(file.content);
  const triggers = extractTriggers(file.content);
  const existing = await getExistingWorkflowTriggers(repoRoot);

  const lines: string[] = [""];
  if (provider) {
    lines.push(`  Provider:     ${provider.name} (${provider.action})`);
    if (provider.model) lines.push(`  Model:        ${provider.model}`);
  }
  if (triggers.length > 0) {
    lines.push(`  Triggers:     ${triggers.map((trigger) => trigger.event).join(", ")}`);
  }

  const permissionEntries = Object.entries(permissions);
  if (permissionEntries.length > 0) {
    lines.push(
      `  Permissions:  ${permissionEntries.map(([name, level]) => `${name}: ${level}`).join(", ")}`,
    );
  }
  if (!timeout) {
    lines.push(`  Warning:      No timeout-minutes set (GitHub default: 6 hours)`);
  }

  const conflicts = findConflicts(
    triggers,
    existing.filter((entry) => entry.name !== file.name),
  );
  for (const conflict of conflicts) {
    lines.push(`  Conflict:     ${conflict}`);
  }

  if (lines.length > 1) {
    for (const line of lines) {
      process.stdout.write(`${line}\n`);
    }
  }

  if (options.showSecretInstructions && secrets.length > 0) {
    const instructions = buildSecretInstructions(secrets, getGitRemoteUrl(repoRoot), isGhReady());
    process.stdout.write("\n");
    for (const instruction of instructions) {
      logger.warn(instruction);
    }
  }

  return secrets;
}

async function runSetup(
  source: string,
  workflow: string,
  requiredSecrets: string[],
  options: AddOptions,
): Promise<SetupResult> {
  if (!hasSetupRequest(options)) {
    return {
      attempted: false,
      status: "not_requested",
      requiredSecrets,
      configuredSecrets: [],
      missingSecrets: requiredSecrets,
      nextCommand: buildSetupNextCommand(source, workflow, requiredSecrets),
    };
  }

  if (requiredSecrets.length === 0) {
    return {
      attempted: true,
      status: "configured",
      requiredSecrets,
      configuredSecrets: [],
      missingSecrets: [],
      nextCommand: null,
    };
  }

  const access = getRepoSecretAccess();
  if (access !== "ready") {
    return {
      attempted: true,
      status: "unavailable",
      requiredSecrets,
      configuredSecrets: [],
      missingSecrets: requiredSecrets,
      nextCommand: buildSetupNextCommand(source, workflow, requiredSecrets),
    };
  }

  const existingSecrets = tryListRepoSecrets();
  if (!existingSecrets) {
    return {
      attempted: true,
      status: "unavailable",
      requiredSecrets,
      configuredSecrets: [],
      missingSecrets: requiredSecrets,
      nextCommand: buildSetupNextCommand(source, workflow, requiredSecrets),
    };
  }
  const missingSecrets = requiredSecrets.filter((secret) => !existingSecrets.has(secret));

  if (missingSecrets.length === 0) {
    return {
      attempted: true,
      status: "configured",
      requiredSecrets,
      configuredSecrets: [],
      missingSecrets: [],
      nextCommand: null,
    };
  }

  if (!hasSetupValueInputs(options)) {
    return {
      attempted: true,
      status: "incomplete",
      requiredSecrets,
      configuredSecrets: [],
      missingSecrets,
      nextCommand: buildSetupNextCommand(source, workflow, missingSecrets),
    };
  }

  const configuredSecrets: string[] = [];
  const values = resolveSecretValues(missingSecrets, options);

  for (const secret of missingSecrets) {
    const value = values.get(secret);
    if (typeof value !== "string") continue;
    if (setRepoSecret(secret, value)) {
      configuredSecrets.push(secret);
      existingSecrets.add(secret);
    }
  }

  const remainingSecrets = requiredSecrets.filter((secret) => !existingSecrets.has(secret));
  return {
    attempted: true,
    status: remainingSecrets.length === 0 ? "configured" : "incomplete",
    requiredSecrets,
    configuredSecrets,
    missingSecrets: remainingSecrets,
    nextCommand: buildSetupNextCommand(source, workflow, remainingSecrets),
  };
}

function emitHumanSetupSummary(result: SetupResult, logger: ReturnType<typeof createLogger>): void {
  if (!result.attempted) return;

  if (result.configuredSecrets.length > 0) {
    logger.info(`Configured secrets: ${result.configuredSecrets.join(", ")}`);
  }

  if (result.status === "configured") {
    logger.info("Setup complete.");
    return;
  }

  if (result.status === "unavailable") {
    logger.warn("Setup unavailable: gh CLI is missing or not authenticated.");
  }

  if (result.missingSecrets.length > 0) {
    logger.warn(`Missing secrets: ${result.missingSecrets.join(", ")}`);
  }
  if (result.nextCommand) {
    logger.info(`Next: ${result.nextCommand}`);
  }
}

function buildInstallJsonResult(
  file: WorkflowFile,
  repoRoot: string,
  targetPath: string,
  slug: string | undefined,
  setupResult: SetupResult,
): object {
  const status =
    setupResult.status === "configured"
      ? "installed_and_configured"
      : setupResult.status === "incomplete"
        ? "installed_setup_incomplete"
        : setupResult.status === "unavailable"
          ? "installed_setup_unavailable"
          : "installed";

  return {
    status,
    workflow: {
      name: file.name,
      source: file.source,
      ...(slug ? { slug } : {}),
      targetPath: relative(repoRoot, targetPath),
    },
    setup: {
      attempted: setupResult.attempted,
      requiredSecrets: setupResult.requiredSecrets,
      configuredSecrets: setupResult.configuredSecrets,
      missingSecrets: setupResult.missingSecrets,
      nextCommand: setupResult.nextCommand,
    },
  };
}

function buildListJsonResult(
  source: string,
  workflows: Array<{ name: string; filename: string }>,
): object {
  return {
    source,
    count: workflows.length,
    workflows,
  };
}

export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description(
      "Install a workflow from any repo. GitHub shorthand uses API lookup first, then HTTPS/SSH clone fallback.",
    )
    .argument(
      "<source>",
      "Source: owner/repo, github:owner/repo, git@github.com:owner/repo.git, https://..., or local path",
    )
    .option("--workflow <name>", "Workflow to install (omit to list available)")
    .option("--force", "Overwrite existing workflow file")
    .option("--yes", "Non-interactive mode")
    .option("--dry-run", "Show what would be installed without writing")
    .option("--verbose", "Show additional details")
    .option("--setup", "Inspect or configure required repository secrets")
    .option(
      "--copy-env <NAME>",
      "Copy a same-named local env var into a repo secret",
      collectValues,
      [],
    )
    .option("--secret <NAME=value>", "Set a repo secret from an explicit value", collectValues, [])
    .option("--all-from-env", "Copy any same-named local env vars for missing secrets")
    .option("--json", "Output JSON")
    .addHelpText(
      "after",
      "\nFor private repos, explicit SSH is the most predictable choice when access depends on SSH keys.",
    )
    .action(async (sourceArg: string, options: AddOptions) => {
      const yes = Boolean(options.yes);
      const dryRun = Boolean(options.dryRun);
      const verbose = Boolean(options.verbose);
      const json = Boolean(options.json);
      const logger = createLogger({ yes, verbose });
      const cwd = process.cwd();
      const repoRoot = getGitRepoRoot(cwd);

      if (!options.workflow) {
        if (hasSetupRequest(options)) {
          throw new CliError("Setup flags require --workflow.");
        }

        const result = await listAvailableWorkflows({ cwd, sourceArg });
        try {
          if (result.workflows.length === 0) {
            throw new CliError(
              `No workflows found in ${sourceArg}. The repo may not have a .github/workflows/ directory.`,
            );
          }

          if (json) {
            writeJson(buildListJsonResult(sourceArg, result.workflows));
            return;
          }

          process.stdout.write(`Available workflows in ${sourceArg}:\n\n`);
          for (const workflow of result.workflows) {
            process.stdout.write(
              `  ${workflow.name.padEnd(30)} openci add ${sourceArg} --workflow ${workflow.name}\n`,
            );
          }
          process.stdout.write(`\n${result.workflows.length} workflow(s) found.\n`);
        } finally {
          await result.cleanup?.();
        }
        return;
      }

      if (dryRun && hasSetupRequest(options)) {
        throw new CliError("--setup cannot be used with --dry-run.");
      }
      if (dryRun && json) {
        throw new CliError("--json cannot be used with --dry-run.");
      }

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
          if (!json) {
            logger.warn(`Overwriting existing ${file.filename}`);
          }
        }

        if (dryRun) {
          process.stdout.write(`Would install ${file.filename} from ${file.source}\n`);
          return;
        }

        const requiredSecrets = extractSecrets(file.content);

        await atomicWrite(targetPath, file.content);
        await upsertInstallationMetadata(repoRoot, {
          name: file.name,
          source: file.source,
          workflow: file.name,
          commit: file.commit,
          contentHash: file.contentHash,
          requiredSecrets,
          targetPath,
          installedAt: new Date().toISOString(),
        });

        const slug = await maybeTrackInstall(file, repoRoot);
        const setupResult = await runSetup(file.source, file.name, requiredSecrets, options);

        if (json) {
          writeJson(buildInstallJsonResult(file, repoRoot, targetPath, slug, setupResult));
        } else {
          if (yes) {
            process.stdout.write(`${targetPath}\n`);
          } else {
            process.stdout.write(`Installed ${file.filename}\n`);
          }

          if (!yes || verbose) {
            await emitHumanAnalysis(
              file,
              repoRoot,
              { showSecretInstructions: !hasSetupRequest(options) },
              logger,
            );
          } else if (requiredSecrets.length > 0 && !hasSetupRequest(options)) {
            const instructions = buildSecretInstructions(
              requiredSecrets,
              getGitRemoteUrl(repoRoot),
              isGhReady(),
            );
            for (const instruction of instructions) {
              logger.warn(instruction);
            }
          }

          emitHumanSetupSummary(setupResult, logger);
        }

        if (setupResult.status === "incomplete" || setupResult.status === "unavailable") {
          process.exitCode = 2;
        }
      } finally {
        await resolved.cleanup?.();
      }
    });
}
