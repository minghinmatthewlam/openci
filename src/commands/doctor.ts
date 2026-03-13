import type { Command } from "commander";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pc from "picocolors";
import { extractSecrets, hasTimeout } from "../analyze/index.js";
import { listInstallationMetadata } from "../manifest/store.js";
import { isGhAuthenticated, isGhAvailable } from "../secrets/check.js";
import { getGitRepoRoot } from "../utils/git.js";

function getGhSecrets(): Set<string> {
  try {
    const output = execFileSync("gh", ["secret", "list", "--json", "name", "--jq", ".[].name"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return new Set(output.split("\n").filter(Boolean));
  } catch {
    return new Set();
  }
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

      const ghReady = isGhAvailable() && isGhAuthenticated();
      const repoSecrets = ghReady ? getGhSecrets() : undefined;

      let healthyCount = 0;

      for (const installation of installations) {
        process.stdout.write(`\n${installation.name}\n`);
        const targetPath = join(repoRoot, installation.targetPath);
        let healthy = true;

        // Check file exists
        let content: string;
        try {
          content = await readFile(targetPath, "utf8");
          process.stdout.write(`  ${pc.green("\u2713")} File exists\n`);
        } catch {
          process.stdout.write(
            `  ${pc.red("\u2717")} File missing at ${installation.targetPath}\n`,
          );
          healthy = false;
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
              healthy = false;
            }
          }
        } else if (secrets.length > 0) {
          process.stdout.write(`  ${pc.yellow("?")} Cannot check secrets (gh CLI not available)\n`);
          for (const secret of secrets) {
            process.stdout.write(`    Requires: ${secret}\n`);
          }
        }

        // Check timeout
        if (hasTimeout(content)) {
          process.stdout.write(`  ${pc.green("\u2713")} timeout-minutes is set\n`);
        } else {
          process.stdout.write(
            `  ${pc.yellow("!")} No timeout-minutes (GitHub default: 6 hours)\n`,
          );
        }

        if (healthy) healthyCount++;
      }

      process.stdout.write(`\n${healthyCount} of ${installations.length} workflow(s) healthy.\n`);
    });
}
