import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readManifest, upsertManifestInstallation } from '../../src/manifest/store.js';

describe('manifest store', () => {
  it('writes and reloads installations', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'openci-manifest-'));

    await upsertManifestInstallation(repoRoot, {
      name: 'ai-pr-review',
      source: 'official',
      provider: 'claude',
      smart: true,
      workflowVersion: '1.0.0',
      targetPath: join(repoRoot, '.github', 'workflows', 'ai-pr-review.yml'),
      installedAt: '2026-03-09T12:34:56Z',
    });

    const manifest = await readManifest(repoRoot);
    const raw = await readFile(join(repoRoot, '.openci.json'), 'utf8');

    expect(manifest?.installations).toHaveLength(1);
    expect(manifest?.installations[0]?.targetPath).toBe('.github/workflows/ai-pr-review.yml');
    expect(raw).toContain('"version": 1');
  });
});
