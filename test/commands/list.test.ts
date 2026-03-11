import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/cli.js';
import { upsertInstallationMetadata } from '../../src/manifest/store.js';

describe('list command', () => {
  it('prints locally installed workflows with provider and source', async () => {
    const repo = await mkdtemp(join(tmpdir(), 'openci-list-'));
    execFileSync('git', ['init', '--initial-branch=main'], { cwd: repo, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.name', 'OpenCI Test'], { cwd: repo, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo, stdio: 'ignore' });
    execFileSync('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: repo, stdio: 'ignore' });

    await upsertInstallationMetadata(repo, {
      name: 'pr-review',
      source: 'minghinmatthewlam/openci',
      provider: 'claude',
      smart: true,
      workflowVersion: '1.0.0',
      targetPath: join(repo, '.github', 'workflows', 'pr-review.yml'),
      installedAt: '2026-03-09T12:34:56Z',
    });

    const result = await runCli(['list'], { cwd: repo });

    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain('pr-review\tclaude\tminghinmatthewlam/openci');
    expect(result.stdout).toContain('1 workflows installed.');
  });
});
