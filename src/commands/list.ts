import type { Command } from 'commander';
import { registerPlaceholderCommand } from './_shared.js';

export function registerListCommand(program: Command): void {
  registerPlaceholderCommand(program, {
    name: 'list',
    description: 'List all available workflows',
  });
}
