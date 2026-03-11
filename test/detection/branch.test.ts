import { cp, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { detectDefaultBranch } from '../../src/detection/branch.js';

const fixtureRoot = '/Users/matthewlam/dev/openci/test/fixtures/detection/npm-standard';
const tempDirs: string[] = [];

function git(cwd: string, args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

describe('detectDefaultBranch', () => {
  afterEach(() => {
    tempDirs.length = 0;
  });

  it('prefers origin HEAD when available', async () => {
    const repo = await mkdtemp(join(tmpdir(), 'openci-branch-'));
    tempDirs.push(repo);
    await cp(fixtureRoot, repo, { recursive: true });

    git(repo, ['init', '--initial-branch=develop']);
    git(repo, ['config', 'user.name', 'OpenCI Test']);
    git(repo, ['config', 'user.email', 'test@example.com']);
    git(repo, ['add', '.']);
    git(repo, ['commit', '-m', 'init']);
    git(repo, ['remote', 'add', 'origin', 'https://github.com/example/project.git']);
    git(repo, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
    git(repo, ['symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main']);

    await expect(detectDefaultBranch(repo)).resolves.toBe('main');
  });

  it('falls back to the local HEAD branch when remote HEAD is unavailable', async () => {
    const repo = await mkdtemp(join(tmpdir(), 'openci-branch-local-'));
    tempDirs.push(repo);
    await cp(fixtureRoot, repo, { recursive: true });

    git(repo, ['init', '--initial-branch=develop']);

    await expect(detectDefaultBranch(repo)).resolves.toBe('develop');
  });
});
