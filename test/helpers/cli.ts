import { vi } from "vitest";
import { buildCli } from "../../src/cli.js";

export interface CliRunResult {
  stdout: string;
  stderr: string;
  error: unknown;
  exitCode: number | undefined;
}

export async function runCli(
  args: string[],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  } = {},
): Promise<CliRunResult> {
  let stdout = "";
  let stderr = "";
  let error: unknown;
  let exitCode: number | undefined;
  const previousExitCode = process.exitCode;
  const previousCwd = process.cwd();
  const previousEnv = { ...process.env };

  const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(((
    chunk: string | Uint8Array,
  ) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write);

  const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(((
    chunk: string | Uint8Array,
  ) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write);

  try {
    process.exitCode = 0;
    if (options.cwd) {
      process.chdir(options.cwd);
    }
    if (options.env) {
      Object.assign(process.env, options.env);
    }
    await buildCli("0.1.0").parseAsync(args, { from: "user" });
  } catch (caught) {
    error = caught;
  } finally {
    exitCode = typeof process.exitCode === "number" ? process.exitCode : undefined;
    process.chdir(previousCwd);
    for (const key of Object.keys(process.env)) {
      if (!(key in previousEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, previousEnv);
    process.exitCode = previousExitCode;
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  }

  return { stdout, stderr, error, exitCode };
}
