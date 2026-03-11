import { mkdtemp, readFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/cli.js';
import * as secretsCheck from '../../src/secrets/check.js';

const registryUrl = 'file:///Users/matthewlam/dev/openci/test/fixtures/registry';

function git(cwd: string, args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

describe('add basic workflow', () => {
  let repo: string;
  const sourceRoot = '/Users/matthewlam/dev/openci/test/fixtures/registry';

  beforeEach(async () => {
    repo = await mkdtemp(join(tmpdir(), 'openci-add-basic-'));
    process.env.OPENCI_REGISTRY_URL = registryUrl;
    git(repo, ['init', '--initial-branch=main']);
    git(repo, ['config', 'user.name', 'OpenCI Test']);
    git(repo, ['config', 'user.email', 'test@example.com']);
    git(repo, ['commit', '--allow-empty', '-m', 'init']);
    git(repo, ['remote', 'add', 'origin', 'https://github.com/acme/project.git']);
    vi.spyOn(secretsCheck, 'isGhAvailable').mockReturnValue(false);
    vi.spyOn(secretsCheck, 'isGhAuthenticated').mockReturnValue(false);
  });

  afterEach(() => {
    delete process.env.OPENCI_REGISTRY_URL;
    vi.restoreAllMocks();
  });

  it('copies a workflow exactly and warns about ignored flags', async () => {
    const result = await runCli(
      [
        'add',
        sourceRoot,
        '--workflow',
        'claude-pr-review-nextjs-pnpm',
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

    const workflowPath = join(repo, '.github', 'workflows', 'claude-pr-review-nextjs-pnpm.yml');
    const written = await readFile(workflowPath, 'utf8');

    expect(result.error).toBeUndefined();
    expect(await realpath(result.stdout.trim())).toBe(await realpath(workflowPath));
    expect(result.stderr).toContain("Ignoring --model for copied-as-is workflow 'claude-pr-review-nextjs-pnpm'.");
    expect(result.stderr).toContain("Ignoring --trigger for copied-as-is workflow 'claude-pr-review-nextjs-pnpm'.");
    expect(result.stderr).toContain("Ignoring --branch for copied-as-is workflow 'claude-pr-review-nextjs-pnpm'.");
    expect(written).toContain('pnpm install --frozen-lockfile');
    expect(written).toContain('model: claude-sonnet-4-6');
  });
});
