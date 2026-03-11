import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectionFixture, localRegistryRoot, makeTempRepo, normalizePath, runCli } from './helpers.js';

describe('integration: add local smart workflow', () => {
  it('installs a smart workflow from a local registry root', () => {
    const repo = makeTempRepo({ fixturePath: detectionFixture('pnpm-next') });
    const result = runCli(['add', localRegistryRoot(), '--workflow', 'pr-review', '--yes'], {
      cwd: repo,
    });

    const targetPath = join(repo, '.github', 'workflows', 'pr-review.yml');

    expect(result.status).toBe(0);
    expect(normalizePath(result.stdout.trim())).toBe(normalizePath(targetPath));
    expect(existsSync(targetPath)).toBe(true);
    expect(readFileSync(targetPath, 'utf8')).toContain('pnpm check');
  });
});
