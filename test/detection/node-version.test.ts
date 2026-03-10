import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { detectNodeVersion } from '../../src/detection/node-version.js';
import { readPackageJson } from '../../src/utils/package-json.js';

const fixturesRoot = '/Users/matthewlam/dev/openci/test/fixtures/detection';

describe('detectNodeVersion', () => {
  it('.nvmrc beats package.json engines', async () => {
    const fixture = join(fixturesRoot, 'bun-svelte');
    const packageJson = await readPackageJson(fixture);

    await expect(detectNodeVersion(fixture, packageJson)).resolves.toBe('24.14.0');
  });

  it('.node-version beats package.json engines', async () => {
    const fixture = join(fixturesRoot, 'yarn-vue');
    const packageJson = await readPackageJson(fixture);

    await expect(detectNodeVersion(fixture, packageJson)).resolves.toBe('22.2.0');
  });

  it('normalizes engines.node ranges to the minimum major version when possible', async () => {
    const fixture = join(fixturesRoot, 'npm-basic');
    const packageJson = await readPackageJson(fixture);

    await expect(detectNodeVersion(fixture, packageJson)).resolves.toBe('20');
  });
});
