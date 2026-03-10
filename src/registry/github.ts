import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CliError } from '../core/errors.js';

export interface ClonedRepo {
  cleanup(): Promise<void>;
  path: string;
  sourceLabel: string;
}

export interface GitRepoSource {
  repoUrl: string;
  sourceLabel: string;
}

export async function cloneGitRepo(source: GitRepoSource): Promise<ClonedRepo> {
  const tempDir = await mkdtemp(join(tmpdir(), 'openci-source-'));
  const repoDir = join(tempDir, 'repo');

  try {
    execFileSync('git', ['clone', '--depth', '1', '--quiet', source.repoUrl, repoDir], {
      stdio: ['ignore', 'ignore', 'pipe'],
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);

    const stderr =
      error && typeof error === 'object' && 'stderr' in error && error.stderr instanceof Buffer
        ? error.stderr.toString('utf8').trim()
        : '';

    throw new CliError(
      stderr
        ? `Failed to clone '${source.sourceLabel}'. ${stderr}`
        : `Failed to clone '${source.sourceLabel}'. Ensure the repo exists and your git credentials are configured.`,
    );
  }

  return {
    path: repoDir,
    sourceLabel: source.sourceLabel,
    async cleanup() {
      await rm(tempDir, { recursive: true, force: true });
    },
  };
}
