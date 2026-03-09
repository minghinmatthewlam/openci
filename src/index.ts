#!/usr/bin/env node
import { buildCli } from './cli.js';
import { CliError } from './core/errors.js';

async function main(): Promise<void> {
  try {
    await buildCli().parseAsync(process.argv);
  } catch (error) {
    if (error instanceof CliError) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = error.exitCode;
      return;
    }

    if (error instanceof Error && 'code' in error && error.code === 'commander.helpDisplayed') {
      process.exitCode = 0;
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

void main();
