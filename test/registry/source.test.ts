import { describe, expect, it } from 'vitest';
import { normalizeInstallRequest } from '../../src/registry/source.js';

describe('normalizeInstallRequest', () => {
  it('parses a local source path and explicit workflow', () => {
    expect(
      normalizeInstallRequest({
        cwd: '/tmp/project',
        sourceArg: './fixtures',
        workflow: 'pr-review',
      }),
    ).toEqual({
      source: { kind: 'local', root: '/tmp/project/fixtures' },
      requestedWorkflow: 'pr-review',
    });
  });

  it('parses GitHub shorthand sources', () => {
    const result = normalizeInstallRequest({
      cwd: '/tmp/project',
      sourceArg: 'acme/workflows',
      workflow: 'pr-review',
    });

    expect(result.source.kind).toBe('git');
    expect(result.source).toMatchObject({
      repoUrl: 'https://github.com/acme/workflows.git',
      sourceLabel: 'acme/workflows',
    });
    expect(result.requestedWorkflow).toBe('pr-review');
  });

  it('parses workflow fragments on the source itself', () => {
    expect(
      normalizeInstallRequest({
        cwd: '/tmp/project',
        sourceArg: 'acme/workflows#pr-review',
      }),
    ).toEqual({
      source: {
        kind: 'git',
        repoUrl: 'https://github.com/acme/workflows.git',
        sourceLabel: 'acme/workflows',
      },
      requestedWorkflow: 'pr-review',
    });
  });
});
