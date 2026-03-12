import { CliError } from "../core/errors.js";
import type { WorkflowMetadata } from "../registry/schemas.js";
import type { OpenCiConfig } from "../template/schemas.js";
import {
  getProviderDefinition,
  type ScriptRuntimeDefinition,
  type SupportedRuntime,
} from "./registry.js";

type RuntimeName = SupportedRuntime;

export function inferProviderFromModel(model: string): string | undefined {
  for (const [providerId, definition] of getProviderMap()) {
    if (definition.modelPrefixes?.some((prefix) => model.startsWith(prefix))) {
      return providerId;
    }
  }

  return undefined;
}

export function applyModelOverride(extraArgs: string | undefined, model: string): string {
  const lines = (extraArgs ?? "")
    .split("\n")
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

  return updated.join("\n");
}

export function resolveSupportedProvider(
  metadata: WorkflowMetadata,
  provider?: string | undefined,
): string | undefined {
  if (metadata.provider.length === 0) {
    if (provider) {
      throw new CliError(
        `Workflow '${metadata.name}' does not declare any providers, but --provider '${provider}' was supplied.`,
      );
    }

    return undefined;
  }

  const selectedProvider = provider ?? metadata.provider[0];
  if (!selectedProvider || !metadata.provider.includes(selectedProvider)) {
    throw new CliError(
      `Workflow '${metadata.name}' doesn't support provider '${selectedProvider}'. Supported: ${metadata.provider.join(", ")}`,
    );
  }

  return selectedProvider;
}

export function resolveProviderPlaceholders(params: {
  metadata: WorkflowMetadata;
  config: OpenCiConfig;
  provider?: string | undefined;
  runtime?: RuntimeName | undefined;
  runner?: string | undefined;
  model?: string | undefined;
}): {
  provider?: string | undefined;
  runtime?: RuntimeName | undefined;
  runner?: string | undefined;
  placeholders: Record<string, string>;
} {
  const inferredProvider = params.model ? inferProviderFromModel(params.model) : undefined;
  const selectedProvider = resolveSupportedProvider(
    params.metadata,
    params.provider ?? inferredProvider,
  );

  if (params.provider && inferredProvider && params.provider !== inferredProvider) {
    throw new CliError(
      `Model '${params.model}' maps to provider '${inferredProvider}', but --provider '${params.provider}' was also supplied.`,
    );
  }

  const runtime = resolveRuntime(params.metadata, params.config, selectedProvider, params.runtime);
  const runner = resolveRunner(params.metadata, params.config, selectedProvider, params.runner);
  const placeholders: Record<string, string> = {
    RUNS_ON: stringifyRunsOn(resolveRunsOnValue(params.config, runner)),
  };

  if (!selectedProvider) {
    if (params.runtime) {
      throw new CliError(
        `Workflow '${params.metadata.name}' does not declare any providers, but --runtime '${params.runtime}' was supplied.`,
      );
    }

    validateRunner(params.metadata, runner);

    return {
      placeholders,
      ...(runner ? { runner } : {}),
    };
  }

  const resolvedRuntime = validateRuntime(params.metadata, selectedProvider, runtime);
  validateRunner(params.metadata, runner);
  const mode = params.config.providerModes[selectedProvider];
  const providerDefinition = getProviderDefinition(selectedProvider);

  if (resolvedRuntime === "action") {
    const actionDef = mode?.action ?? providerDefinition?.runtimes.action;

    if (!actionDef) {
      throw new CliError(
        `Workflow '${params.metadata.name}' has no action runtime config for provider '${selectedProvider}'.`,
      );
    }

    placeholders.AGENT_ACTION = actionDef.action;
    if (actionDef.authKey) placeholders.AGENT_AUTH_KEY = actionDef.authKey;
    if (actionDef.secretName) placeholders.AGENT_SECRET_NAME = actionDef.secretName;
    if (actionDef.extraArgs) {
      placeholders.AGENT_EXTRA_ARGS = params.model
        ? applyModelOverride(actionDef.extraArgs, params.model)
        : actionDef.extraArgs;
    }
    placeholders.PROVIDER_STEP = buildActionStep(placeholders);
  }

  if (resolvedRuntime === "script") {
    const scriptDef = mode?.script ?? providerDefinition?.runtimes.script;

    if (!scriptDef) {
      throw new CliError(
        `Workflow '${params.metadata.name}' has no script runtime config for provider '${selectedProvider}'.`,
      );
    }

    placeholders.PROVIDER_STEP = buildScriptStep(
      scriptDef,
      params.model ?? providerDefinition?.defaultModel,
    );
  }

  placeholders.PROVIDER = selectedProvider;
  placeholders.RUNTIME = resolvedRuntime;
  if (runner) placeholders.RUNNER = runner;

  return {
    placeholders,
    provider: selectedProvider,
    runtime: resolvedRuntime,
    ...(runner ? { runner } : {}),
  };
}

function buildActionStep(values: Record<string, string>): string {
  const lines = ["- uses: " + values.AGENT_ACTION, "  with:"];
  if (values.AGENT_AUTH_KEY && values.AGENT_SECRET_NAME) {
    lines.push(`    ${values.AGENT_AUTH_KEY}: \${{ secrets.${values.AGENT_SECRET_NAME} }}`);
  }
  if (values.AGENT_EXTRA_ARGS) {
    for (const line of values.AGENT_EXTRA_ARGS.split("\n")) {
      lines.push(`    ${line}`);
    }
  }
  return lines.join("\n");
}

function buildScriptStep(definition: ScriptRuntimeDefinition, model?: string): string {
  const lines = ["- name: Run provider"];
  const env = {
    ...definition.env,
    ...(model ? { MODEL: model } : {}),
  };

  if (Object.keys(env).length > 0) {
    lines.push("  env:");
    for (const [key, value] of Object.entries(env)) {
      lines.push(`    ${key}: ${value}`);
    }
  }

  lines.push(`  run: ${definition.run}`);
  return lines.join("\n");
}

function getProviderMap() {
  return ["claude", "codex", "glm", "custom"]
    .map((providerId) => [providerId, getProviderDefinition(providerId)] as const)
    .filter(
      (entry): entry is readonly [string, NonNullable<ReturnType<typeof getProviderDefinition>>] =>
        Boolean(entry[1]),
    );
}

function resolveRuntime(
  metadata: WorkflowMetadata,
  config: OpenCiConfig,
  provider: string | undefined,
  runtime: RuntimeName | undefined,
): RuntimeName | undefined {
  if (runtime) {
    return runtime;
  }

  if (provider) {
    const mode = config.providerModes[provider];
    if (mode?.runtime) return mode.runtime;
  }

  if (config.defaults.runtime) return config.defaults.runtime;
  if (metadata.defaultRuntime) return metadata.defaultRuntime;
  if (metadata.runtimes.length > 0) return metadata.runtimes[0];

  if (provider) {
    const defaultRuntime = getProviderDefinition(provider)?.defaultRuntime;
    if (defaultRuntime) {
      return defaultRuntime;
    }
  }

  return undefined;
}

function validateRuntime(
  metadata: WorkflowMetadata,
  provider: string,
  runtime: RuntimeName | undefined,
): RuntimeName {
  if (!runtime) {
    throw new CliError(
      `Workflow '${metadata.name}' could not resolve a runtime for provider '${provider}'.`,
    );
  }

  if (metadata.runtimes.length > 0 && !metadata.runtimes.includes(runtime)) {
    throw new CliError(
      `Workflow '${metadata.name}' doesn't support runtime '${runtime}'. Supported: ${metadata.runtimes.join(", ")}`,
    );
  }

  const providerDefinition = getProviderDefinition(provider);
  if (providerDefinition && !providerDefinition.supportedRuntimes.includes(runtime)) {
    throw new CliError(
      `Provider '${provider}' doesn't support runtime '${runtime}'. Supported: ${providerDefinition.supportedRuntimes.join(", ")}`,
    );
  }

  return runtime;
}

function resolveRunner(
  metadata: WorkflowMetadata,
  config: OpenCiConfig,
  provider: string | undefined,
  runner: string | undefined,
): string | undefined {
  if (runner) {
    return runner;
  }

  if (provider) {
    const mode = config.providerModes[provider];
    if (mode?.runner) {
      return mode.runner;
    }
  }

  return config.defaults.runner ?? metadata.defaultRunner ?? metadata.runners[0];
}

function validateRunner(metadata: WorkflowMetadata, runner: string | undefined): void {
  if (!runner || metadata.runners.length === 0) {
    return;
  }

  if (!metadata.runners.includes(runner)) {
    throw new CliError(
      `Workflow '${metadata.name}' doesn't support runner '${runner}'. Supported: ${metadata.runners.join(", ")}`,
    );
  }
}

function resolveRunsOnValue(config: OpenCiConfig, runner: string | undefined): string | string[] {
  if (!runner) {
    return "ubuntu-latest";
  }

  return config.runners[runner]?.runsOn ?? runner;
}

function stringifyRunsOn(runsOn: string | string[]): string {
  if (Array.isArray(runsOn)) {
    return `[${runsOn.join(", ")}]`;
  }

  return runsOn;
}
