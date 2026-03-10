import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGitHubWorkflowBundle } from '../../src/registry/github.js';

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('fetchGitHubWorkflowBundle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads a named workflow from a multi-workflow repo', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.endsWith('/contents/')) {
        return response([{ name: 'workflows', path: 'workflows', type: 'dir', download_url: null }]);
      }

      if (url.endsWith('/contents/workflows')) {
        return response([{ name: 'ai-pr-review', path: 'workflows/ai-pr-review', type: 'dir', download_url: null }]);
      }

      if (url.endsWith('/contents/workflows/ai-pr-review')) {
        return response([
          {
            name: 'metadata.json',
            path: 'workflows/ai-pr-review/metadata.json',
            type: 'file',
            download_url: 'https://example.test/metadata.json',
          },
          {
            name: 'README.md',
            path: 'workflows/ai-pr-review/README.md',
            type: 'file',
            download_url: 'https://example.test/README.md',
          },
          {
            name: 'workflow.yml',
            path: 'workflows/ai-pr-review/workflow.yml',
            type: 'file',
            download_url: 'https://example.test/workflow.yml',
          },
        ]);
      }

      if (url === 'https://example.test/metadata.json') {
        return new Response(
          JSON.stringify({
            name: 'ai-pr-review',
            displayName: 'AI Pull Request Review',
            description: 'Automated review',
            version: '1.0.0',
            author: 'acme',
            tags: ['code-review'],
            provider: ['claude'],
            smart: false,
            requiredSecrets: { claude: ['ANTHROPIC_API_KEY'] },
            triggers: ['pull_request'],
            stacks: ['any'],
            minGitHubActionsVersion: null,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }

      if (url === 'https://example.test/README.md') {
        return new Response('# README', { status: 200 });
      }

      if (url === 'https://example.test/workflow.yml') {
        return new Response('name: AI PR Review', { status: 200 });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const bundle = await fetchGitHubWorkflowBundle(
      { kind: 'github', owner: 'acme', repo: 'workflows' },
      'ai-pr-review',
    );

    expect(bundle.metadata.name).toBe('ai-pr-review');
    expect(bundle.workflow).toContain('AI PR Review');
  });
});
