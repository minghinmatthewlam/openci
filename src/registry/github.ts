import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CliError } from "../core/errors.js";

export interface ClonedRepo {
  cleanup(): Promise<void>;
  path: string;
  sourceLabel: string;
}

export interface GitRepoSource {
  fallbackRepoUrls?: string[];
  repoUrl: string;
  sourceLabel: string;
}

function isSshRepoUrl(repoUrl: string): boolean {
  return repoUrl.startsWith("git@") || repoUrl.startsWith("ssh://");
}

function buildNonInteractiveSshCommand(existingCommand?: string): string {
  const sshFlags = "-o BatchMode=yes -o StrictHostKeyChecking=accept-new";
  if (!existingCommand) return `ssh ${sshFlags}`;

  const trimmed = existingCommand.trim();
  if (!trimmed.startsWith("ssh")) return trimmed;

  const sanitized = trimmed
    .replace(/\s+-o\s+BatchMode=\S+/g, "")
    .replace(/\s+-o\s+StrictHostKeyChecking=\S+/g, "")
    .trim();

  const sshArgs = sanitized === "ssh" ? "" : sanitized.slice(3).trim();
  return ["ssh", sshFlags, sshArgs].filter(Boolean).join(" ");
}

export function buildGitCloneEnv(repoUrl: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
  if (isSshRepoUrl(repoUrl)) {
    env.GIT_SSH_COMMAND = buildNonInteractiveSshCommand(env.GIT_SSH_COMMAND);
  }
  return env;
}

export async function cloneGitRepo(source: GitRepoSource): Promise<ClonedRepo> {
  const repoUrls = [source.repoUrl, ...(source.fallbackRepoUrls ?? [])];
  const errors: Array<{ repoUrl: string; stderr: string }> = [];

  for (const repoUrl of repoUrls) {
    const tempDir = await mkdtemp(join(tmpdir(), "openci-source-"));
    const repoDir = join(tempDir, "repo");

    try {
      execFileSync("git", ["clone", "--depth", "1", "--quiet", repoUrl, repoDir], {
        stdio: ["ignore", "ignore", "pipe"],
        env: buildGitCloneEnv(repoUrl),
      });

      return {
        path: repoDir,
        sourceLabel: source.sourceLabel,
        async cleanup() {
          await rm(tempDir, { recursive: true, force: true });
        },
      };
    } catch (error) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
      const stderr =
        error && typeof error === "object" && "stderr" in error && error.stderr instanceof Buffer
          ? error.stderr.toString("utf8").trim()
          : "";
      errors.push({ repoUrl, stderr });
    }
  }

  const fallbackHint =
    repoUrls.length > 1 ? " Tried GitHub clone fallback over HTTPS and SSH." : "";
  const errorDetails = errors
    .filter((entry) => entry.stderr)
    .map((entry) => `${entry.repoUrl}: ${entry.stderr}`)
    .join(" | ");

  throw new CliError(
    errorDetails
      ? `Failed to clone '${source.sourceLabel}'.${fallbackHint} ${errorDetails}`
      : `Failed to clone '${source.sourceLabel}'.${fallbackHint} Ensure the repo exists and your git credentials are configured.`,
  );
}
