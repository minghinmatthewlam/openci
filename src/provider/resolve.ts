import { CliError } from '../core/errors.js';
import type { WorkflowMetadata } from '../registry/schemas.js';
import type { OpenCiConfig } from '../template/schemas.js';

const MODEL_PREFIX_TO_PROVIDER = new Map<string, string>([
  ['claude-', 'claude'],
  ['codex-', 'codex'],
]);

export function inferProviderFromModel(model: string): string | undefined {
  for (const [prefix, provider] of MODEL_PREFIX_TO_PROVIDER) {
    if (model.startsWith(prefix)) {
      return provider;
    }
  }

  return undefined;
}

export function applyModelOverride(extraArgs: string | undefined, model: string): string {
  const lines = (extraArgs ?? '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);

  let replaced = false;
  const updated = lines.map((line) => {
    if (/^\s*model\s*:/.test(line)) {
      replaced = true;
      return `model: ${model}`;
    }

    return line;
  });

  if (!replaced) {
    updated.unshift(`model: ${model}`);
  }

  return updated.join('\n');
}

export function resolveSupportedProvider(
  metadata: WorkflowMetadata,
  provider?: string | undefined,
): string {
  const selectedProvider = provider ?? 'claude';

  if (!metadata.provider.includes(selectedProvider)) {
    throw new CliError(
      `Workflow '${metadata.name}' doesn't support provider '${selectedProvider}'. Supported: ${metadata.provider.join(', ')}`,
    );
  }

  return selectedProvider;
}

export function resolveProviderPlaceholders(params: {
  metadata: WorkflowMetadata;
  config: OpenCiConfig;
  provider?: string | undefined;
  model?: string | undefined;
}): { provider: string; placeholders: Record<string, string> } {
  const inferredProvider = params.model ? inferProviderFromModel(params.model) : undefined;
  const provider = params.provider ?? inferredProvider ?? 'claude';

  if (params.provider && inferredProvider && params.provider !== inferredProvider) {
    throw new CliError(
      `Model '${params.model}' maps to provider '${inferredProvider}', but --provider '${params.provider}' was also supplied.`,
    );
  }

  if (!params.metadata.provider.includes(provider)) {
    throw new CliError(
      `Workflow '${params.metadata.name}' doesn't support provider '${provider}'. Supported: ${params.metadata.provider.join(', ')}`,
    );
  }

  const providerConfig = params.config.providers[provider];
  if (!providerConfig) {
    throw new CliError(`Workflow '${params.metadata.name}' has no provider config for '${provider}'.`);
  }

  const placeholders = { ...providerConfig };
  if (params.model) {
    placeholders.AGENT_EXTRA_ARGS = applyModelOverride(placeholders.AGENT_EXTRA_ARGS, params.model);
  }

  return {
    provider,
    placeholders,
  };
}
