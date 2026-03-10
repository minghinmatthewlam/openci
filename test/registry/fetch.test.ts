import { mkdtemp, mkdir, readFile, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CliError } from '../../src/core/errors.js';
import { fetchRegistry, getRegistryCachePath } from '../../src/registry/fetch.js';

const registryFixture = JSON.stringify({
  version: 1,
  updatedAt: '2026-03-09T00:00:00Z',
  workflows: [],
});

describe('fetchRegistry', () => {
  let cacheRoot: string;
  let originalXdg: string | undefined;

  beforeEach(async () => {
    cacheRoot = await mkdtemp(join(tmpdir(), 'openci-cache-'));
    originalXdg = process.env.XDG_CACHE_HOME;
    process.env.XDG_CACHE_HOME = cacheRoot;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalXdg === undefined) {
      delete process.env.XDG_CACHE_HOME;
      return;
    }

    process.env.XDG_CACHE_HOME = originalXdg;
  });

  it('returns cached registry without network when the cache is fresh', async () => {
    const cachePath = getRegistryCachePath();
    await mkdir(join(cacheRoot, 'openci'), { recursive: true });
    await writeFile(cachePath, registryFixture, 'utf8');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const registry = await fetchRegistry();

    expect(registry.version).toBe(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refreshes a stale cache from the network', async () => {
    const cachePath = getRegistryCachePath();
    await mkdir(join(cacheRoot, 'openci'), { recursive: true });
    await writeFile(cachePath, JSON.stringify({ version: 1, updatedAt: 'old', workflows: [] }), 'utf8');
    await utimes(cachePath, new Date(Date.now() - 7_200_000), new Date(Date.now() - 7_200_000));

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(registryFixture, {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const registry = await fetchRegistry();
    const cached = JSON.parse(await readFile(cachePath, 'utf8')) as { updatedAt: string };

    expect(registry.updatedAt).toBe('2026-03-09T00:00:00Z');
    expect(cached.updatedAt).toBe('2026-03-09T00:00:00Z');
  });

  it('throws a CliError for invalid registry data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"version":"bad"}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(fetchRegistry({ fresh: true })).rejects.toBeInstanceOf(CliError);
  });
});
