import type { Command } from 'commander';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readManifest } from '../manifest/store.js';
import { getGitRepoRoot } from '../utils/git.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show installed workflows and their health')
    .action(async () => {
      const repoRoot = getGitRepoRoot(process.cwd());
      const manifest = await readManifest(repoRoot);
      const workflowsDir = join(repoRoot, '.github', 'workflows');

      let workflowFiles: string[] = [];
      try {
        workflowFiles = (await readdir(workflowsDir))
          .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
          .map((file) => join('.github', 'workflows', file));
      } catch {
        workflowFiles = [];
      }

      process.stdout.write('name\tprovider\tsource\tversion\tfile\tstatus\n');

      if (!manifest) {
        for (const file of workflowFiles) {
          const name = file.replace(/^\.github\/workflows\//, '').replace(/\.ya?ml$/, '');
          process.stdout.write(`${name}\tunknown\tunknown\tunknown\t${file}\tuntracked-file\n`);
        }
        return;
      }

      const trackedFiles = new Set(manifest.installations.map((item) => item.targetPath));
      for (const installation of manifest.installations) {
        const status = workflowFiles.includes(installation.targetPath) ? 'installed' : 'missing-file';
        process.stdout.write(
          `${installation.name}\t${installation.provider}\t${installation.source}\t${installation.workflowVersion}\t${installation.targetPath}\t${status}\n`,
        );
      }

      for (const file of workflowFiles) {
        if (!trackedFiles.has(file)) {
          const name = file.replace(/^\.github\/workflows\//, '').replace(/\.ya?ml$/, '');
          process.stdout.write(`${name}\tunknown\tunknown\tunknown\t${file}\tuntracked-file\n`);
        }
      }
    });
}
