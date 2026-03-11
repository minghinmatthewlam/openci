import { describe, expect, it } from 'vitest';
import { buildSecretInstructions, parseGithubRemote } from '../../src/secrets/prompt.js';
import type { WorkflowMetadata } from '../../src/registry/schemas.js';

const metadata: WorkflowMetadata = {
  name: 'pr-review',
  displayName: 'Pull Request Review',
  description: 'Automated review',
  version: '1.0.0',
  author: 'openci',
  tags: ['code-review'],
  provider: ['claude'],
  smart: true,
  requiredSecrets: {
    claude: ['ANTHROPIC_API_KEY'],
  },
  triggers: ['pull_request'],
  stacks: ['any'],
  minGitHubActionsVersion: null,
};

describe('secret prompts', () => {
  it('parses GitHub SSH remotes', () => {
    expect(parseGithubRemote('git@github.com:openci/workflows.git')).toEqual({
      owner: 'openci',
      repo: 'workflows',
    });
  });

  it('returns gh secret commands when gh is available', () => {
    expect(
      buildSecretInstructions(metadata, 'claude', 'git@github.com:acme/project.git', true),
    ).toContain('Run: gh secret set ANTHROPIC_API_KEY');
  });

  it('falls back to the repo secrets URL without gh', () => {
    expect(
      buildSecretInstructions(metadata, 'claude', 'https://github.com/acme/project.git', false),
    ).toContain('Visit: https://github.com/acme/project/settings/secrets/actions/new');
  });
});
