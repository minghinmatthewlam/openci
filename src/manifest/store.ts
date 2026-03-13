import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { InstallationSchema, type Installation } from "./schema.js";

export function getInstallationMetadataDir(repoRoot: string): string {
  return join(repoRoot, ".github", "workflows", ".openci");
}

export function getInstallationMetadataPath(repoRoot: string, workflowName: string): string {
  return join(getInstallationMetadataDir(repoRoot), `${workflowName}.json`);
}

export async function listInstallationMetadata(repoRoot: string): Promise<Installation[]> {
  const sidecarDir = getInstallationMetadataDir(repoRoot);
  try {
    const entries = await readdir(sidecarDir);
    const items = await Promise.all(
      entries
        .filter((entry) => entry.endsWith(".json"))
        .map(async (entry) => {
          try {
            const raw = await readFile(join(sidecarDir, entry), "utf8");
            const result = InstallationSchema.safeParse(JSON.parse(raw));
            if (!result.success) {
              process.stderr.write(`Skipping ${entry}: unrecognized format\n`);
              return undefined;
            }
            return result.data;
          } catch {
            return undefined;
          }
        }),
    );
    return items
      .filter((item): item is Installation => Boolean(item))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export async function readInstallationMetadata(
  repoRoot: string,
  workflowName: string,
): Promise<Installation | undefined> {
  const metadataPath = getInstallationMetadataPath(repoRoot, workflowName);
  try {
    const raw = await readFile(metadataPath, "utf8");
    const result = InstallationSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

export async function upsertInstallationMetadata(
  repoRoot: string,
  installation: Omit<Installation, "targetPath"> & { targetPath: string },
): Promise<void> {
  const relativeTargetPath = relative(repoRoot, installation.targetPath);
  const data: Installation = { ...installation, targetPath: relativeTargetPath };
  const metadataPath = getInstallationMetadataPath(repoRoot, installation.name);
  await mkdir(dirname(metadataPath), { recursive: true });
  await writeFile(metadataPath, JSON.stringify(data, null, 2), "utf8");
}

export async function deleteInstallationMetadata(repoRoot: string, name: string): Promise<void> {
  const metadataPath = getInstallationMetadataPath(repoRoot, name);
  await rm(metadataPath, { force: true });
}
