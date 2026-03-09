import type { Command } from 'commander';
import { registerPlaceholderCommand } from './_shared.js';

export function registerCreateCommand(program: Command): void {
  registerPlaceholderCommand(program, {
    name: 'create',
    description: 'Scaffold a new workflow for contributors',
    argument: '<name>',
  });
}
