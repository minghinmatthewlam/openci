import { describe, expect, it } from 'vitest';
import { CliError } from '../../src/core/errors.js';
import {
  applyModelOverride,
  inferProviderFromModel,
  resolveProviderPlaceholders,
} from '../../src/provider/resolve.js';
import type { WorkflowMetadata } from '../../src/registry/schemas.js';
import type { OpenCiConfig } from '../../src/template/schemas.js';

const metadata: WorkflowMetadata = {
  name: 'ai-pr-review',
  displayName: 'AI Pull Request Review',
  description: 'Automated review',
  version: '1.0.0',
  author: 'openci',
  tags: ['code-review'],
  provider: ['claude', 'codex'],
  smart: true,
  requiredSecrets: {
    claude: ['ANTHROPIC_API_KEY'],
    codex: ['OPENAI_API_KEY'],
  },
  triggers: ['pull_request'],
  stacks: ['any'],
  minGitHubActionsVersion: null,
};

const config: OpenCiConfig = {
  detect: {},
  providers: {
    claude: {
      AGENT_EXTRA_ARGS: 'model: claude-sonnet-4-6',
    },
    codex: {
      AGENT_EXTRA_ARGS: 'model: codex-mini',
    },
  },
  substitutions: {},
};

describe('provider resolution', () => {
  it('infers provider from the model name', () => {
    expect(inferProviderFromModel('claude-opus-4-6')).toBe('claude');
    expect(inferProviderFromModel('codex-mini')).toBe('codex');
  });

  it('overrides the provider model line', () => {
    expect(applyModelOverride('model: claude-sonnet-4-6', 'claude-opus-4-6')).toBe('model: claude-opus-4-6');
  });

  it('throws when provider and model disagree', () => {
    expect(() =>
      resolveProviderPlaceholders({
        metadata,
        config,
        provider: 'claude',
        model: 'codex-mini',
      }),
    ).toThrow(CliError);
  });
});
