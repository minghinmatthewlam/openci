import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

export function getCacheRoot(): string {
  return process.env.XDG_CACHE_HOME
    ? join(process.env.XDG_CACHE_HOME, 'openci')
    : join(homedir(), '.openci');
}

export async function readJsonIfFresh(path: string, ttlMs: number): Promise<unknown | undefined> {
  try {
    const [fileStat, raw] = await Promise.all([stat(path), readFile(path, 'utf8')]);
    const ageMs = Date.now() - fileStat.mtimeMs;
    if (ageMs > ttlMs) {
      return undefined;
    }

    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2), 'utf8');
}
