import type { Command } from 'commander';
import { registerPlaceholderCommand } from './_shared.js';

export function registerStatusCommand(program: Command): void {
  registerPlaceholderCommand(program, {
    name: 'status',
    description: 'Show installed workflows and their health',
  });
}
