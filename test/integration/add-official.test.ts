import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectionFixture, makeTempRepo, normalizePath, registryEnv, runCli } from './helpers.js';

describe('integration: add official workflow', () => {
  it('installs a smart workflow from the official registry override', () => {
    const repo = makeTempRepo({ fixturePath: detectionFixture('pnpm-next') });
    const result = runCli(['add', 'ai-pr-review', '--yes'], {
      cwd: repo,
      env: registryEnv(),
    });

    const targetPath = join(repo, '.github', 'workflows', 'ai-pr-review.yml');
    const manifestPath = join(repo, '.openci.json');

    expect(result.status).toBe(0);
    expect(normalizePath(result.stdout.trim())).toBe(normalizePath(targetPath));
    expect(result.stderr).toContain('Required secret: ANTHROPIC_API_KEY');
    expect(existsSync(targetPath)).toBe(true);
    expect(readFileSync(targetPath, 'utf8')).toContain('pnpm install --frozen-lockfile');
    expect(readFileSync(manifestPath, 'utf8')).toContain('"source": "official"');
  });
});
