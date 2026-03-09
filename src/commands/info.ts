import type { Command } from 'commander';
import { registerPlaceholderCommand } from './_shared.js';

export function registerInfoCommand(program: Command): void {
  registerPlaceholderCommand(program, {
    name: 'info',
    description: 'Show details about a specific workflow',
    argument: '<workflow>',
  });
}
