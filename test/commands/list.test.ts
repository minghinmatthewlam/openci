import { describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/cli.js';
import * as registryResolve from '../../src/registry/resolve.js';

describe('list command', () => {
  it('prints workflows alphabetically with a count footer', async () => {
    vi.spyOn(registryResolve, 'searchRegistry').mockResolvedValue([
      {
        name: 'ai-pr-review',
        displayName: 'AI Pull Request Review',
        description: 'Automated code review',
        tags: ['code-review'],
        provider: ['claude'],
        smart: true,
        stacks: ['any'],
      },
      {
        name: 'claude-pr-review-nextjs-pnpm',
        displayName: 'Claude PR Review',
        description: 'Static workflow',
        tags: ['nextjs'],
        provider: ['claude'],
        smart: false,
        stacks: ['nextjs'],
      },
    ]);

    const result = await runCli(['list']);

    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain('ai-pr-review\tAutomated code review');
    expect(result.stdout).toContain('claude-pr-review-nextjs-pnpm\tStatic workflow');
    expect(result.stdout).toContain('2 workflows found.');
  });
});
