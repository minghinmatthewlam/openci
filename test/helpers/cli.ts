import { vi } from 'vitest';
import { buildCli } from '../../src/cli.js';

export interface CliRunResult {
  stdout: string;
  stderr: string;
  error: unknown;
}

export async function runCli(args: string[]): Promise<CliRunResult> {
  let stdout = '';
  let stderr = '';
  let error: unknown;

  const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: string | Uint8Array) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write);

  const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(((chunk: string | Uint8Array) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write);

  try {
    await buildCli('0.1.0').parseAsync(args, { from: 'user' });
  } catch (caught) {
    error = caught;
  } finally {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  }

  return { stdout, stderr, error };
}
