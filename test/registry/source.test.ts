import { describe, expect, it } from 'vitest';
import { normalizeInstallRequest } from '../../src/registry/source.js';

describe('normalizeInstallRequest', () => {
  it('defaults to the official registry for plain workflow names', () => {
    expect(
      normalizeInstallRequest({
        cwd: '/tmp/project',
        workflowArg: 'ai-pr-review',
      }),
    ).toEqual({
      source: { kind: 'official' },
      requestedWorkflow: 'ai-pr-review',
    });
  });

  it('parses local paths from --from', () => {
    const result = normalizeInstallRequest({
      cwd: '/tmp/project',
      workflowArg: 'ai-pr-review',
      from: './fixtures',
    });

    expect(result.source.kind).toBe('local');
    expect(result.requestedWorkflow).toBe('ai-pr-review');
  });

  it('parses GitHub shorthand with workflow fragments', () => {
    expect(
      normalizeInstallRequest({
        cwd: '/tmp/project',
        from: 'acme/workflows#ai-pr-review',
      }),
    ).toEqual({
      source: {
        kind: 'github',
        owner: 'acme',
        repo: 'workflows',
        workflowName: 'ai-pr-review',
      },
      requestedWorkflow: 'ai-pr-review',
    });
  });
});
