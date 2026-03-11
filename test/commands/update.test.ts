import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/cli.js';

function git(cwd: string, args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

describe('update command', () => {
  it('updates an installed workflow from its stored source metadata', async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), 'openci-update-source-'));
    await cp('/Users/matthewlam/dev/openci/test/fixtures/registry', sourceRoot, { recursive: true });
    const sourceRegistryRoot = sourceRoot;

    const repo = await mkdtemp(join(tmpdir(), 'openci-update-target-'));
    await cp('/Users/matthewlam/dev/openci/test/fixtures/detection/pnpm-next', repo, { recursive: true });
    git(repo, ['init', '--initial-branch=main']);
    git(repo, ['config', 'user.name', 'OpenCI Test']);
    git(repo, ['config', 'user.email', 'test@example.com']);
    git(repo, ['add', '.']);
    git(repo, ['commit', '-m', 'init']);

    const installResult = await runCli(['add', sourceRegistryRoot, '--workflow', 'pr-review', '--yes'], { cwd: repo });
    expect(installResult.error).toBeUndefined();

    await writeFile(
      join(sourceRegistryRoot, 'workflows', 'pr-review', 'workflow.yml.tmpl'),
      'name: AI PR Review\njobs:\n  review:\n    steps:\n      - run: echo updated-template\n',
      'utf8',
    );

    const updateResult = await runCli(['update', 'pr-review'], { cwd: repo });
    const workflowPath = join(repo, '.github', 'workflows', 'pr-review.yml');
    const written = await readFile(workflowPath, 'utf8');

    expect(updateResult.error).toBeUndefined();
    expect(updateResult.stdout).toContain('pr-review\tupdated');
    expect(written).toContain('updated-template');
  });
});
