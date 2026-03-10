import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { detectPackageManager } from '../../src/detection/package-manager.js';

const fixturesRoot = '/Users/matthewlam/dev/openci/test/fixtures/detection';

describe('detectPackageManager', () => {
  it('prefers pnpm when conflicting lockfiles exist', async () => {
    await expect(detectPackageManager(join(fixturesRoot, 'pnpm-next'))).resolves.toBe('pnpm');
  });

  it('falls back to npm when no lockfile is present', async () => {
    await expect(detectPackageManager(join(fixturesRoot, 'no-package-json'))).resolves.toBe('npm');
  });
});
