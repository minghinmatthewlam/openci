import { describe, expect, it } from 'vitest';
import { CliError } from '../../src/core/errors.js';
import { buildCli } from '../../src/cli.js';

async function runCommand(args: string[]): Promise<void> {
  await buildCli('0.1.0').parseAsync(args, { from: 'user' });
}

describe('CLI placeholder commands', () => {
  it.each([
    ['status', ['status']],
    ['create', ['create', 'my-workflow']],
  ])('%s exits with a placeholder error', async (_name, args) => {
    await expect(runCommand(args)).rejects.toEqual(new CliError(`${args[0]} is not implemented yet`, 1));
  });

  it('init is registered as a non-failing stub', async () => {
    await expect(runCommand(['init'])).resolves.toBeUndefined();
  });
});
