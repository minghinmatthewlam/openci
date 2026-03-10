import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { localRegistryRoot, makeTempRepo, normalizePath, runCli } from './helpers.js';

describe('integration: add local basic workflow', () => {
  it('installs a basic workflow from a local registry root and ignores unsupported flags', () => {
    const repo = makeTempRepo();
    const result = runCli(
      [
        'add',
        'claude-pr-review-nextjs-pnpm',
        '--from',
        localRegistryRoot(),
        '--model',
        'claude-opus-4-6',
        '--trigger',
        'push',
        '--branch',
        'develop',
        '--yes',
      ],
      { cwd: repo },
    );

    const targetPath = join(repo, '.github', 'workflows', 'claude-pr-review-nextjs-pnpm.yml');

    expect(result.status).toBe(0);
    expect(normalizePath(result.stdout.trim())).toBe(normalizePath(targetPath));
    expect(result.stderr).toContain("Ignoring --model for basic workflow 'claude-pr-review-nextjs-pnpm'.");
    expect(existsSync(targetPath)).toBe(true);
    expect(readFileSync(targetPath, 'utf8')).toContain('model: claude-sonnet-4-6');
  });
});
