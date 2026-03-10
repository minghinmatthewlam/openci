import { spawnSync } from 'node:child_process';

function commandSucceeds(args: string[]): boolean {
  const result = spawnSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'ignore', 'ignore'],
  });

  return result.status === 0;
}

export function isGhAvailable(): boolean {
  return commandSucceeds(['--version']);
}

export function isGhAuthenticated(): boolean {
  return commandSucceeds(['auth', 'status']);
}
