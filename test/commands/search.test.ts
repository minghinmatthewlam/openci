import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { searchRegistry } from '../../src/registry/resolve.js';

describe('searchRegistry', () => {
  let cacheRoot: string;

  beforeEach(async () => {
    cacheRoot = await mkdtemp(join(tmpdir(), 'openci-search-'));
    process.env.XDG_CACHE_HOME = cacheRoot;
    process.env.OPENCI_REGISTRY_URL = 'file:///Users/matthewlam/dev/openci/test/fixtures/registry';
  });

  afterEach(() => {
    delete process.env.OPENCI_REGISTRY_URL;
    delete process.env.XDG_CACHE_HOME;
  });

  it('ranks exact name matches ahead of other matches', async () => {
    const results = await searchRegistry('ai-pr-review');

    expect(results[0]?.name).toBe('ai-pr-review');
  });

  it('returns an empty list for no matches', async () => {
    const results = await searchRegistry('does-not-exist');

    expect(results).toEqual([]);
  });
});
