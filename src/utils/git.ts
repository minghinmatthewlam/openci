import { execFileSync } from "node:child_process";
import { CliError } from "../core/errors.js";

export function tryGit(args: string[], cwd: string): string | undefined {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

export function getGitRepoRoot(cwd: string): string {
  const root = tryGit(["rev-parse", "--show-toplevel"], cwd);
  if (!root) {
    throw new CliError("Not in a git repository. Run this from your project root.");
  }

  return root;
}

export function getGitRemoteUrl(cwd: string, remote = "origin"): string | undefined {
  return tryGit(["config", "--get", `remote.${remote}.url`], cwd);
}
