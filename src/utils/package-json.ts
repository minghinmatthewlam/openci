import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface PackageJsonLike {
  name?: string;
  engines?: {
    node?: string;
  };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export async function readPackageJson(root: string): Promise<PackageJsonLike | undefined> {
  try {
    const raw = await readFile(join(root, "package.json"), "utf8");
    return JSON.parse(raw) as PackageJsonLike;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}
