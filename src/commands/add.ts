import type { Command } from 'commander';
import { registerPlaceholderCommand } from './_shared.js';

export function registerAddCommand(program: Command): void {
  registerPlaceholderCommand(program, {
    name: 'add',
    description: 'Install a workflow into your repo',
    argument: '<workflow>',
  });
}
