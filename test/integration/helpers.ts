import { cpSync, existsSync, mkdirSync, realpathSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync, type SpawnSyncReturns } from 'node:child_process';

const workspaceRoot = '/Users/matthewlam/dev/openci';
const cliPath = join(workspaceRoot, 'dist', 'index.js');
let built = false;

export function ensureBuiltCli(): void {
  if (existsSync(cliPath)) {
    built = true;
    return;
  }

  execFileSync('npm', ['run', 'build'], {
    cwd: workspaceRoot,
    stdio: 'ignore',
  });

  built = true;
}

export function makeTempRepo(options?: { fixturePath?: string }): string {
  const repo = mkdtempSync(join(tmpdir(), 'openci-integration-'));

  if (options?.fixturePath) {
    cpSync(options.fixturePath, repo, { recursive: true });
  }

  execFileSync('git', ['init', '--initial-branch=main'], { cwd: repo, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'OpenCI Test'], { cwd: repo, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo, stdio: 'ignore' });
  execFileSync('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: repo, stdio: 'ignore' });
  execFileSync('git', ['remote', 'add', 'origin', 'https://github.com/acme/project.git'], {
    cwd: repo,
    stdio: 'ignore',
  });

  return repo;
}

export function runCli(
  args: string[],
  options: {
    cwd: string;
    env?: NodeJS.ProcessEnv;
  },
): SpawnSyncReturns<string> {
  ensureBuiltCli();

  return spawnSync('node', [cliPath, ...args], {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
    },
    encoding: 'utf8',
  });
}

export function registryEnv(): NodeJS.ProcessEnv {
  return {
    OPENCI_REGISTRY_URL: 'file:///Users/matthewlam/dev/openci/test/fixtures/registry',
  };
}

export function localRegistryRoot(): string {
  return '/Users/matthewlam/dev/openci/test/fixtures/registry';
}

export function detectionFixture(name: string): string {
  return `/Users/matthewlam/dev/openci/test/fixtures/detection/${name}`;
}

export function normalizePath(pathname: string): string {
  return realpathSync(pathname);
}

export function normalizeTempPath(pathname: string): string {
  return pathname.replace(/^\/private/, '');
}
