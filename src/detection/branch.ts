import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

function tryGit(args: string[], cwd: string): string | undefined {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

export async function detectDefaultBranch(root: string): Promise<string | undefined> {
  const symbolic = tryGit(['symbolic-ref', 'refs/remotes/origin/HEAD'], root);
  if (symbolic?.startsWith('refs/remotes/origin/')) {
    return symbolic.replace('refs/remotes/origin/', '');
  }

  const remoteShow = tryGit(['remote', 'show', 'origin'], root);
  if (remoteShow) {
    const match = remoteShow.match(/HEAD branch:\s+([^\s]+)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  try {
    const head = (await readFile(join(root, '.git', 'HEAD'), 'utf8')).trim();
    if (head.startsWith('ref: refs/heads/')) {
      return head.replace('ref: refs/heads/', '');
    }
  } catch {
    // Ignore non-git directories and missing HEAD.
  }

  return undefined;
}
