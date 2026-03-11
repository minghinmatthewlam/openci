import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { ManifestInstallationSchema, type ManifestInstallation } from './schema.js';

export function getInstallationMetadataDir(repoRoot: string): string {
  return join(repoRoot, '.github', 'workflows', '.openci');
}

export function getInstallationMetadataPath(repoRoot: string, workflowName: string): string {
  return join(getInstallationMetadataDir(repoRoot), `${workflowName}.json`);
}

export async function listInstallationMetadata(repoRoot: string): Promise<ManifestInstallation[]> {
  const sidecarDir = getInstallationMetadataDir(repoRoot);
  try {
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(sidecarDir);
    const items = await Promise.all(
      entries
        .filter((entry) => entry.endsWith('.json'))
        .map(async (entry) => {
          const raw = await readFile(join(sidecarDir, entry), 'utf8');
          const parsed = JSON.parse(raw);
          const result = ManifestInstallationSchema.safeParse(parsed);
          return result.success ? result.data : undefined;
        }),
    );

    const valid = items.filter((item): item is ManifestInstallation => Boolean(item));
    return valid.sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    return [];
  }
}

export async function readInstallationMetadata(
  repoRoot: string,
  workflowName: string,
): Promise<ManifestInstallation | undefined> {
  const installation = (await listInstallationMetadata(repoRoot)).find((item) => item.name === workflowName);
  return installation;
}

export async function upsertInstallationMetadata(
  repoRoot: string,
  installation: Omit<ManifestInstallation, 'targetPath'> & { targetPath: string },
): Promise<void> {
  const relativeTargetPath = relative(repoRoot, installation.targetPath);
  const nextInstallation: ManifestInstallation = {
    ...installation,
    targetPath: relativeTargetPath,
  };

  const metadataPath = getInstallationMetadataPath(repoRoot, installation.name);
  await mkdir(dirname(metadataPath), { recursive: true });
  await writeFile(metadataPath, JSON.stringify(nextInstallation, null, 2), 'utf8');
}
