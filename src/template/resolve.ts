import type { DetectionResult } from '../detection/index.js';
import type { WorkflowMetadata } from '../registry/schemas.js';
import { CliError } from '../core/errors.js';
import { resolveProviderPlaceholders } from '../provider/resolve.js';
import type { DetectionKey, OpenCiConfig } from './schemas.js';

const IMPLICIT_DETECT_BY_PLACEHOLDER: Record<string, DetectionKey> = {
  INSTALL_CMD: 'packageManager',
  VALIDATION_CMD: 'validationCommand',
  TARGET_BRANCH: 'defaultBranch',
  NODE_VERSION: 'nodeVersion',
  FRAMEWORK: 'framework',
  PACKAGE_MANAGER: 'packageManager',
};

export interface AddFlags {
  provider?: string | undefined;
  model?: string | undefined;
  trigger?: string | undefined;
  branch?: string | undefined;
}

export function resolveTemplateContext(params: {
  metadata: WorkflowMetadata;
  config: OpenCiConfig;
  detected: DetectionResult;
  flags: AddFlags;
}): { provider: string; context: Record<string, string> } {
  const { provider, placeholders: providerPlaceholders } = resolveProviderPlaceholders({
    metadata: params.metadata,
    config: params.config,
    provider: params.flags.provider,
    model: params.flags.model,
  });

  const context: Record<string, string> = {
    ...providerPlaceholders,
  };

  const cliOverrides: Record<string, string | undefined> = {
    TRIGGER_EVENT: params.flags.trigger,
    TARGET_BRANCH: params.flags.branch,
  };

  for (const [placeholder, rule] of Object.entries(params.config.substitutions)) {
    const cliOverride = cliOverrides[placeholder];
    if (cliOverride) {
      context[placeholder] = cliOverride;
      continue;
    }

    const detectKey = rule._detect ?? IMPLICIT_DETECT_BY_PLACEHOLDER[placeholder];
    const detectedValue = detectKey ? params.detected[detectKey] : undefined;

    if (typeof detectedValue === 'string') {
      const mappedValue = rule[detectedValue];
      context[placeholder] = typeof mappedValue === 'string' ? mappedValue : detectedValue;
      continue;
    }

    if (typeof rule._default === 'string') {
      context[placeholder] = rule._default;
      continue;
    }

    throw new CliError(`Unable to resolve {{${placeholder}}} for workflow '${params.metadata.name}'.`);
  }

  context.PROVIDER = provider;

  return { provider, context };
}
