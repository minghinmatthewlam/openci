import type { PackageJsonLike } from '../utils/package-json.js';
import type { PackageManager } from './package-manager.js';

function scriptInvocation(manager: PackageManager, script: string): string {
  switch (manager) {
    case 'npm':
      return script === 'test' ? 'npm test' : `npm run ${script}`;
    case 'pnpm':
      return `pnpm ${script}`;
    case 'yarn':
      return `yarn ${script}`;
    case 'bun':
      return script === 'test' ? 'bun test' : `bun run ${script}`;
  }
}

export function detectValidationCommand(
  packageJson: PackageJsonLike | undefined,
  packageManager: PackageManager,
): string | undefined {
  const scripts = packageJson?.scripts ?? {};

  if (scripts.check) {
    return scriptInvocation(packageManager, 'check');
  }

  const parts: string[] = [];
  if (scripts.lint) {
    parts.push(scriptInvocation(packageManager, 'lint'));
  }
  if (scripts.test) {
    parts.push(scriptInvocation(packageManager, 'test'));
  }

  if (parts.length > 0) {
    return parts.join(' && ');
  }

  return undefined;
}
