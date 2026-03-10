import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface RegistryEntry {
  name: string;
  displayName: string;
  description: string;
  tags: string[];
  provider: string[];
  smart: boolean;
  stacks: string[];
  author?: string;
  repository?: string;
  publishedAt?: string;
}

export interface WorkflowMetadata extends RegistryEntry {
  version: string;
  author: string;
  requiredSecrets: Record<string, string[]>;
  triggers: string[];
  minGitHubActionsVersion?: string | null;
}

export interface WorkflowBundle {
  metadata: WorkflowMetadata;
  readme: string;
  config?: string;
  template?: string;
  workflow?: string;
}

export interface RegistryDocument {
  version: number;
  updatedAt: string;
  workflows: RegistryEntry[];
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRegistryRoot = path.resolve(currentDir, '../data/registry');

function getRegistryRoot(): string {
  return process.env.OPENCI_WEB_REGISTRY_PATH
    ? path.resolve(process.cwd(), process.env.OPENCI_WEB_REGISTRY_PATH)
    : defaultRegistryRoot;
}

export async function readRegistry(): Promise<RegistryDocument> {
  const registryPath = path.join(getRegistryRoot(), 'registry.json');
  const raw = await readFile(registryPath, 'utf8');
  return JSON.parse(raw) as RegistryDocument;
}

export async function listRegistryWorkflows(): Promise<RegistryEntry[]> {
  const registry = await readRegistry();
  return Promise.all(
    [...registry.workflows]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (workflow) => {
        const bundle = await readWorkflowBundle(workflow.name);
        return {
          ...workflow,
          author: bundle?.metadata.author,
          repository: bundle?.metadata.repository,
          publishedAt: bundle?.metadata.publishedAt,
        };
      }),
  );
}

export async function readWorkflowBundle(name: string): Promise<WorkflowBundle | undefined> {
  const workflowRoot = path.join(getRegistryRoot(), 'workflows', name);

  try {
    const metadataRaw = await readFile(path.join(workflowRoot, 'metadata.json'), 'utf8');
    const metadata = JSON.parse(metadataRaw) as WorkflowMetadata;

    const [readme, config, template, workflow] = await Promise.all([
      readOptional(path.join(workflowRoot, 'README.md')),
      readOptional(path.join(workflowRoot, 'openci.config.json')),
      readOptional(path.join(workflowRoot, 'workflow.yml.tmpl')),
      readOptional(path.join(workflowRoot, 'workflow.yml')),
    ]);

    return {
      metadata,
      readme: readme ?? '',
      config: config ?? undefined,
      template: template ?? undefined,
      workflow: workflow ?? undefined,
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
}

async function readOptional(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
}
