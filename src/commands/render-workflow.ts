import { detectRepo, type DetectionResult } from "../detection/index.js";
import { resolveSupportedProvider } from "../provider/resolve.js";
import type { WorkflowBundle } from "../registry/resolve.js";
import { resolveTemplateContext } from "../template/resolve.js";
import { substituteTemplate } from "../template/substitute.js";

export interface RenderFlags {
  provider?: string | undefined;
  runtime?: "action" | "script" | undefined;
  runner?: string | undefined;
  model?: string | undefined;
  trigger?: string | undefined;
  branch?: string | undefined;
}

export interface RenderResult {
  output: string;
  provider?: string | undefined;
  runtime?: "action" | "script" | undefined;
  runner?: string | undefined;
  detected?: DetectionResult | undefined;
  context?: Record<string, string> | undefined;
}

/**
 * Pure render pipeline shared by `add` and `update`.
 * Resolves provider, detects repo (for smart workflows), renders the template,
 * and returns the final workflow content. Does NOT write any files.
 */
export async function renderWorkflow(
  bundle: WorkflowBundle,
  repoRoot: string,
  flags: RenderFlags,
): Promise<RenderResult> {
  let provider = resolveSupportedProvider(bundle.metadata, flags.provider);
  let runtime: "action" | "script" | undefined =
    bundle.metadata.defaultRuntime ?? bundle.metadata.runtimes[0];
  let runner: string | undefined = bundle.metadata.defaultRunner ?? bundle.metadata.runners[0];
  let output = bundle.workflow;
  let detected: DetectionResult | undefined;
  let context: Record<string, string> | undefined;

  if (bundle.metadata.smart) {
    if (!bundle.workflowTemplate || !bundle.config) {
      throw new Error(`Workflow '${bundle.metadata.name}' is missing smart workflow files.`);
    }

    detected = await detectRepo(repoRoot, bundle.config.detect);
    const resolved = resolveTemplateContext({
      metadata: bundle.metadata,
      config: bundle.config,
      detected,
      flags,
    });

    provider = resolved.provider;
    runtime = resolved.runtime;
    runner = resolved.runner;
    context = resolved.context;
    output = substituteTemplate(bundle.workflowTemplate, resolved.context);
  }

  if (!output) {
    throw new Error(`Workflow '${bundle.metadata.name}' could not be resolved.`);
  }

  return { output, provider, runtime, runner, detected, context };
}
