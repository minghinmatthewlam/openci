import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { coerce, minVersion, valid, validRange } from 'semver';
import type { PackageJsonLike } from '../utils/package-json.js';

async function readText(path: string): Promise<string | undefined> {
  try {
    return (await readFile(path, 'utf8')).trim();
  } catch {
    return undefined;
  }
}

function normalizeVersion(input: string): string | undefined {
  const raw = input.trim().replace(/^v/, '');

  if (!raw) {
    return undefined;
  }

  if (valid(raw)) {
    const parsed = coerce(raw);
    return parsed?.version ?? raw;
  }

  if (validRange(raw)) {
    const minimum = minVersion(raw);
    if (!minimum) {
      return undefined;
    }

    return minimum.minor === 0 && minimum.patch === 0
      ? String(minimum.major)
      : `${minimum.major}.${minimum.minor}.${minimum.patch}`;
  }

  return raw;
}

export async function detectNodeVersion(
  root: string,
  packageJson?: PackageJsonLike,
): Promise<string | undefined> {
  const nvmrc = await readText(join(root, '.nvmrc'));
  if (nvmrc) {
    return normalizeVersion(nvmrc);
  }

  const nodeVersionFile = await readText(join(root, '.node-version'));
  if (nodeVersionFile) {
    return normalizeVersion(nodeVersionFile);
  }

  const enginesNode = packageJson?.engines?.node;
  if (typeof enginesNode === 'string') {
    return normalizeVersion(enginesNode);
  }

  return undefined;
}
