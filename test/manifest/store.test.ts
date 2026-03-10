import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listInstallationMetadata, upsertInstallationMetadata } from '../../src/manifest/store.js';

describe('manifest store', () => {
  it('writes and reloads installation sidecars', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'openci-manifest-'));

    await upsertInstallationMetadata(repoRoot, {
      name: 'ai-pr-review',
      source: 'official',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      smart: true,
      workflowVersion: '1.0.0',
      targetPath: join(repoRoot, '.github', 'workflows', 'ai-pr-review.yml'),
      installedAt: '2026-03-09T12:34:56Z',
    });

    const installations = await listInstallationMetadata(repoRoot);
    const raw = await readFile(join(repoRoot, '.github', 'workflows', '.openci', 'ai-pr-review.json'), 'utf8');

    expect(installations).toHaveLength(1);
    expect(installations[0]?.targetPath).toBe('.github/workflows/ai-pr-review.yml');
    expect(raw).toContain('"model": "claude-sonnet-4-6"');
  });
});
