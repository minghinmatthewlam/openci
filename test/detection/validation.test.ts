import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { detectValidationCommand } from '../../src/detection/validation.js';
import { readPackageJson } from '../../src/utils/package-json.js';

const fixturesRoot = '/Users/matthewlam/dev/openci/test/fixtures/detection';

describe('detectValidationCommand', () => {
  it('prefers the check script when present', async () => {
    const packageJson = await readPackageJson(join(fixturesRoot, 'pnpm-next'));

    expect(detectValidationCommand(packageJson, 'pnpm')).toBe('pnpm check');
  });

  it('returns lint and test joined when both exist', async () => {
    const packageJson = await readPackageJson(join(fixturesRoot, 'npm-basic'));

    expect(detectValidationCommand(packageJson, 'npm')).toBe('npm run lint && npm test');
  });

  it('returns a single available script when only one exists', async () => {
    const packageJson = await readPackageJson(join(fixturesRoot, 'bun-svelte'));

    expect(detectValidationCommand(packageJson, 'bun')).toBe('bun test');
  });
});
