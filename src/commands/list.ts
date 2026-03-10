import type { Command } from 'commander';
import { searchRegistry } from '../registry/resolve.js';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List all available workflows')
    .action(async () => {
      const workflows = await searchRegistry();

      if (workflows.length === 0) {
        process.stdout.write('0 workflows found.\n');
        return;
      }

      for (const workflow of workflows) {
        process.stdout.write(`${workflow.name}\t${workflow.description}\n`);
      }

      process.stdout.write(`\n${workflows.length} workflows found.\n`);
    });
}
