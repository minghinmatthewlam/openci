import type { Command } from 'commander';
import { registerPlaceholderCommand } from './_shared.js';

export function registerSearchCommand(program: Command): void {
  registerPlaceholderCommand(program, {
    name: 'search',
    description: 'Search for workflows by keyword',
    argument: '[query]',
  });
}
