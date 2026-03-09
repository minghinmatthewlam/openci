import type { Command } from 'commander';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Interactive setup: detect repo, recommend workflows')
    .action(async () => {
      process.stdout.write('Planned for a future release\n');
    });
}
