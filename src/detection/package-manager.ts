import { access } from "node:fs/promises";
import { join } from "node:path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

const LOCKFILE_ORDER: Array<[string, PackageManager]> = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["package-lock.json", "npm"],
  ["npm-shrinkwrap.json", "npm"],
];

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function detectPackageManager(root: string): Promise<PackageManager | undefined> {
  for (const [file, manager] of LOCKFILE_ORDER) {
    if (await exists(join(root, file))) {
      return manager;
    }
  }

  return "npm";
}
