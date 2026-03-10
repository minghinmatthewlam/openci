import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { ManifestSchema, type Manifest, type ManifestInstallation } from './schema.js';

export function getManifestPath(repoRoot: string): string {
  return join(repoRoot, '.openci.json');
}

export async function readManifest(repoRoot: string): Promise<Manifest | undefined> {
  try {
    const raw = await readFile(getManifestPath(repoRoot), 'utf8');
    const parsed = JSON.parse(raw);
    const result = ManifestSchema.safeParse(parsed);
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

async function writeManifest(repoRoot: string, manifest: Manifest): Promise<void> {
  const manifestPath = getManifestPath(repoRoot);
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

export async function upsertManifestInstallation(
  repoRoot: string,
  installation: Omit<ManifestInstallation, 'targetPath'> & { targetPath: string },
): Promise<void> {
  const manifest = (await readManifest(repoRoot)) ?? {
    version: 1 as const,
    installations: [],
  };

  const relativeTargetPath = relative(repoRoot, installation.targetPath);
  const nextInstallation: ManifestInstallation = {
    ...installation,
    targetPath: relativeTargetPath,
  };

  const installations = manifest.installations.filter((item) => item.name !== installation.name);
  installations.push(nextInstallation);

  await writeManifest(repoRoot, {
    version: 1,
    installations,
  });
}
