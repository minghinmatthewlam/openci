import type { Command } from 'commander';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildSmartScaffold } from '../scaffold/smart.js';
import { buildWorkflowScaffold } from '../scaffold/workflow.js';
import { createLogger } from '../utils/logger.js';

export function registerCreateCommand(program: Command): void {
  program
    .command('create')
    .description('Scaffold a new workflow for contributors')
    .argument('<name>')
    .option('--smart', 'Generate a smart workflow scaffold')
    .action(async (name: string, options: { smart?: boolean }, command: Command) => {
      const globals = command.optsWithGlobals<{ yes?: boolean; verbose?: boolean }>();
      const yes = Boolean(globals.yes);
      const logger = createLogger({ yes, verbose: Boolean(globals.verbose) });
      const files = options.smart ? buildSmartScaffold(name) : buildWorkflowScaffold(name);
      const targetDir = join(process.cwd(), 'workflows', name);

      await mkdir(targetDir, { recursive: true });
      await Promise.all(
        Object.entries(files).map(([relativePath, content]) =>
          writeFile(join(targetDir, relativePath), content, 'utf8'),
        ),
      );

      if (yes) {
        logger.machineResult(targetDir);
        return;
      }

      process.stdout.write(`Created ${targetDir}\n`);
      process.stdout.write('Next steps:\n');
      process.stdout.write(`1. Edit the files in ${targetDir}\n`);
      process.stdout.write(`2. Test: npx openci add . --workflow ${name} --dry-run\n`);
      process.stdout.write('3. Submit a PR to the registry\n');
    });
}
