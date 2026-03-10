import type { Command } from 'commander';
import { searchRegistry } from '../registry/resolve.js';

export function registerSearchCommand(program: Command): void {
  program
    .command('search')
    .description('Search for workflows by keyword')
    .argument('[query]')
    .action(async (query?: string) => {
      const workflows = await searchRegistry(query);

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
