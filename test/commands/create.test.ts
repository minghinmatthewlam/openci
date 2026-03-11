import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/cli.js';

function git(cwd: string, args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

describe('create command', () => {
  it('creates a workflow scaffold by default', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'openci-create-workflow-'));

    const result = await runCli(['create', 'my-workflow', '--yes'], { cwd });
    const metadata = await readFile(join(cwd, 'workflows', 'my-workflow', 'metadata.json'), 'utf8');

    expect(result.error).toBeUndefined();
    expect(result.stdout.trim()).toContain('/workflows/my-workflow');
    expect(metadata).toContain('"smart": false');
  });

  it('creates a smart scaffold and can be dry-run installed locally', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'openci-create-smart-'));
    git(cwd, ['init', '--initial-branch=main']);
    git(cwd, ['config', 'user.name', 'OpenCI Test']);
    git(cwd, ['config', 'user.email', 'test@example.com']);
    git(cwd, ['commit', '--allow-empty', '-m', 'init']);

    const createResult = await runCli(['create', 'my-workflow', '--smart', '--yes'], { cwd });
    const addResult = await runCli(['add', '.', '--workflow', 'my-workflow', '--dry-run', '--yes'], { cwd });
    const template = await readFile(join(cwd, 'workflows', 'my-workflow', 'workflow.yml.tmpl'), 'utf8');

    expect(createResult.error).toBeUndefined();
    expect(addResult.error).toBeUndefined();
    expect(addResult.stdout.trim()).toContain('/.github/workflows/my-workflow.yml');
    expect(template).toContain('{{INSTALL_CMD}}');
  });
});
