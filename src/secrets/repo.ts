import { execFileSync } from "node:child_process";
import { isGhAuthenticated, isGhAvailable } from "./check.js";

export type RepoSecretAccess = "ready" | "gh_unavailable" | "gh_unauthenticated";

export function getRepoSecretAccess(): RepoSecretAccess {
  if (!isGhAvailable()) return "gh_unavailable";
  if (!isGhAuthenticated()) return "gh_unauthenticated";
  return "ready";
}

export function listRepoSecrets(): Set<string> {
  const output = execFileSync("gh", ["secret", "list", "--json", "name", "--jq", ".[].name"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

  return new Set(output.split("\n").filter(Boolean));
}

export function tryListRepoSecrets(): Set<string> | undefined {
  try {
    return listRepoSecrets();
  } catch {
    return undefined;
  }
}

export function setRepoSecret(name: string, value: string): boolean {
  try {
    execFileSync("gh", ["secret", "set", name], {
      input: value,
      encoding: "utf8",
      stdio: ["pipe", "ignore", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}
