import { CliError } from '../core/errors.js';
import { fetchText } from '../utils/http.js';
import { fetchRegistry, getOfficialWorkflowFileUrl } from './fetch.js';
import { WorkflowMetadataSchema, type RegistryWorkflow, type WorkflowMetadata } from './schemas.js';
import { OpenCiConfigSchema, type OpenCiConfig } from '../template/schemas.js';

function scoreWorkflow(workflow: RegistryWorkflow, query: string): number {
  const normalizedQuery = query.toLowerCase();
  const name = workflow.name.toLowerCase();
  const displayName = workflow.displayName.toLowerCase();
  const description = workflow.description.toLowerCase();
  const tags = workflow.tags.map((tag) => tag.toLowerCase());
  const providers = workflow.provider.map((provider) => provider.toLowerCase());
  const stacks = workflow.stacks.map((stack) => stack.toLowerCase());

  let score = 0;

  if (name === normalizedQuery) score += 1_000;
  if (displayName === normalizedQuery) score += 900;
  if (tags.includes(normalizedQuery)) score += 700;
  if (providers.includes(normalizedQuery)) score += 500;
  if (stacks.includes(normalizedQuery)) score += 450;
  if (name.includes(normalizedQuery)) score += 300;
  if (displayName.includes(normalizedQuery)) score += 250;
  if (description.includes(normalizedQuery)) score += 150;
  if (tags.some((tag) => tag.includes(normalizedQuery))) score += 125;
  if (providers.some((provider) => provider.includes(normalizedQuery))) score += 100;
  if (stacks.some((stack) => stack.includes(normalizedQuery))) score += 90;

  return score;
}

export async function findRegistryWorkflowByName(name: string): Promise<RegistryWorkflow | undefined> {
  const registry = await fetchRegistry();
  return registry.workflows.find((workflow) => workflow.name === name);
}

export async function searchRegistry(query?: string): Promise<RegistryWorkflow[]> {
  const registry = await fetchRegistry();

  if (!query?.trim()) {
    return [...registry.workflows].sort((left, right) => left.name.localeCompare(right.name));
  }

  return registry.workflows
    .map((workflow) => ({
      workflow,
      score: scoreWorkflow(workflow, query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.workflow.name.localeCompare(right.workflow.name))
    .map((entry) => entry.workflow);
}

export async function fetchOfficialWorkflowMetadata(name: string): Promise<WorkflowMetadata> {
  const url = getOfficialWorkflowFileUrl(name, 'metadata.json');
  return fetchJsonLikeMetadata(url);
}

export async function fetchOfficialWorkflowReadme(name: string): Promise<string> {
  return fetchText(getOfficialWorkflowFileUrl(name, 'README.md'));
}

export interface OfficialWorkflowBundle {
  metadata: WorkflowMetadata;
  readme: string;
  workflow?: string;
  workflowTemplate?: string;
  config?: OpenCiConfig;
}

export async function fetchOfficialWorkflowBundle(name: string): Promise<OfficialWorkflowBundle> {
  const metadata = await fetchOfficialWorkflowMetadata(name);
  const readmePromise = fetchOfficialWorkflowReadme(name);

  if (metadata.smart) {
    const [readme, workflowTemplate, configRaw] = await Promise.all([
      readmePromise,
      fetchText(getOfficialWorkflowFileUrl(name, 'workflow.yml.tmpl')),
      fetchText(getOfficialWorkflowFileUrl(name, 'openci.config.json')),
    ]);

    return {
      metadata,
      readme,
      workflowTemplate,
      config: parseOpenCiConfig(name, configRaw),
    };
  }

  const [readme, workflow] = await Promise.all([
    readmePromise,
    fetchText(getOfficialWorkflowFileUrl(name, 'workflow.yml')),
  ]);

  return {
    metadata,
    readme,
    workflow,
  };
}

async function fetchJsonLikeMetadata(url: string): Promise<WorkflowMetadata> {
  const raw = await fetchText(url);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CliError(`Invalid metadata for '${url}'.`);
  }

  const result = WorkflowMetadataSchema.safeParse(parsed);
  if (!result.success) {
    throw new CliError(`Invalid metadata for '${url}'.`);
  }

  return result.data;
}

function parseOpenCiConfig(name: string, raw: string): OpenCiConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CliError(`Invalid OpenCI config for workflow '${name}'.`);
  }

  const result = OpenCiConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new CliError(`Invalid OpenCI config for workflow '${name}'.`);
  }

  return result.data;
}
