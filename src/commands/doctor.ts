import type { Command } from "commander";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pc from "picocolors";
import { extractSecrets, hasTimeout } from "../analyze/index.js";
import { listInstallationMetadata } from "../manifest/store.js";
import { getRepoSecretAccess, tryListRepoSecrets } from "../secrets/repo.js";
import { getGitRepoRoot } from "../utils/git.js";

type HealthStatus = "healthy" | "warning" | "error";

function escalateWarning(status: HealthStatus): HealthStatus {
  return status === "error" ? status : "warning";
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Check health of installed workflows")
    .action(async () => {
      const repoRoot = getGitRepoRoot(process.cwd());
      const installations = await listInstallationMetadata(repoRoot);

      if (installations.length === 0) {
        process.stdout.write("0 workflows installed.\n");
        return;
      }

      const secretAccess = getRepoSecretAccess();
      const repoSecrets = secretAccess === "ready" ? tryListRepoSecrets() : undefined;
      const counts: Record<HealthStatus, number> = {
        healthy: 0,
        warning: 0,
        error: 0,
      };

      for (const installation of installations) {
        process.stdout.write(`\n${installation.name}\n`);
        const targetPath = join(repoRoot, installation.targetPath);
        let status: HealthStatus = "healthy";

        // Check file exists
        let content: string;
        try {
          content = await readFile(targetPath, "utf8");
          process.stdout.write(`  ${pc.green("\u2713")} File exists\n`);
        } catch {
          process.stdout.write(
            `  ${pc.red("\u2717")} File missing at ${installation.targetPath}\n`,
          );
          status = "error";
          counts[status]++;
          continue;
        }

        // Check secrets
        const secrets = extractSecrets(content);
        if (repoSecrets) {
          for (const secret of secrets) {
            if (repoSecrets.has(secret)) {
              process.stdout.write(`  ${pc.green("\u2713")} ${secret} is set\n`);
            } else {
              process.stdout.write(
                `  ${pc.red("\u2717")} ${secret} is not set \u2192 gh secret set ${secret}\n`,
              );
              status = "error";
            }
          }
        } else if (secrets.length > 0) {
          process.stdout.write(`  ${pc.yellow("?")} Cannot check secrets (gh CLI not available)\n`);
          for (const secret of secrets) {
            process.stdout.write(`    Requires: ${secret}\n`);
          }
          status = escalateWarning(status);
        }

        // Check timeout
        if (hasTimeout(content)) {
          process.stdout.write(`  ${pc.green("\u2713")} timeout-minutes is set\n`);
        } else {
          process.stdout.write(
            `  ${pc.yellow("!")} No timeout-minutes (GitHub default: 6 hours)\n`,
          );
          status = escalateWarning(status);
        }

        process.stdout.write(`  Summary: ${status}\n`);
        counts[status]++;
      }

      process.stdout.write(
        `\nSummary: ${counts.healthy} healthy, ${counts.warning} warning, ${counts.error} error.\n`,
      );
    });
}
