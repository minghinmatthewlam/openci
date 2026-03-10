import { afterEach, describe, expect, it } from 'vitest';
import { listRegistryWorkflows, readRegistry, readWorkflowBundle, readWorkflowBundleByAuthor } from '../lib/registry';

describe('registry loader', () => {
  afterEach(() => {
    delete process.env.OPENCI_WEB_REGISTRY_PATH;
  });

  it('loads the default local registry document', async () => {
    const registry = await readRegistry();

    expect(registry.version).toBe(1);
    expect(registry.workflows.length).toBeGreaterThan(0);
  });

  it('lists workflows alphabetically', async () => {
    const workflows = await listRegistryWorkflows();

    expect(workflows.map((workflow) => workflow.name)).toEqual([
      'ai-commit-lint',
      'ai-issue-resolver',
      'ai-pr-review',
      'ai-release-notes',
      'ai-security-scan',
      'claude-pr-review-nextjs-pnpm',
    ]);
  });

  it('reads a workflow bundle with metadata and README', async () => {
    const bundle = await readWorkflowBundle('ai-pr-review');

    expect(bundle?.metadata.displayName).toBe('AI Pull Request Review');
    expect(bundle?.readme).toContain('AI Pull Request Review');
    expect(bundle?.metadata.repository).toBe('openci/workflows');
  });

  it('requires author and name to match for detail lookups', async () => {
    const ok = await readWorkflowBundleByAuthor('openci', 'ai-pr-review');
    const mismatch = await readWorkflowBundleByAuthor('wrong-author', 'ai-pr-review');

    expect(ok?.metadata.author).toBe('openci');
    expect(mismatch).toBeUndefined();
  });
});
