import { CliError } from '../core/errors.js';
import { fetchJson, fetchText } from '../utils/http.js';
import { parseOpenCiConfig, type WorkflowBundle } from './resolve.js';
import { WorkflowMetadataSchema } from './schemas.js';
import { OpenCiConfigSchema } from '../template/schemas.js';
import type { InstallSource } from './source.js';
import { z } from 'zod';

const GitHubContentSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(['file', 'dir']),
  download_url: z.string().nullable().optional(),
});

const GitHubContentsSchema = z.array(GitHubContentSchema);

type GitHubContent = z.infer<typeof GitHubContentSchema>;

function contentsUrl(owner: string, repo: string, path = ''): string {
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
}

async function fetchContents(owner: string, repo: string, path = ''): Promise<GitHubContent[]> {
  return fetchJson(contentsUrl(owner, repo, path), GitHubContentsSchema);
}

async function readContent(item: GitHubContent): Promise<string> {
  if (!item.download_url) {
    throw new CliError(`Unable to download '${item.path}' from GitHub.`);
  }

  return fetchText(item.download_url);
}

async function loadBundleFromDirectory(
  owner: string,
  repo: string,
  dirPath: string,
  sourceLabel: string,
): Promise<WorkflowBundle> {
  const entries = await fetchContents(owner, repo, dirPath);
  const byName = new Map(entries.map((entry) => [entry.name, entry]));
  const metadataEntry = byName.get('metadata.json');

  if (!metadataEntry) {
    throw new CliError(`Workflow metadata missing in '${sourceLabel}'.`);
  }

  const metadataRaw = await readContent(metadataEntry);
  const metadata = WorkflowMetadataSchema.parse(JSON.parse(metadataRaw));
  const readme = byName.get('README.md') ? await readContent(byName.get('README.md')!) : '';

  if (metadata.smart) {
    const workflowTemplateEntry = byName.get('workflow.yml.tmpl');
    const configEntry = byName.get('openci.config.json');

    if (!workflowTemplateEntry || !configEntry) {
      throw new CliError(`Smart workflow '${metadata.name}' is incomplete in '${sourceLabel}'.`);
    }

    const [workflowTemplate, configRaw] = await Promise.all([
      readContent(workflowTemplateEntry),
      readContent(configEntry),
    ]);

    return {
      metadata,
      readme,
      workflowTemplate,
      config: parseOpenCiConfig(metadata.name, configRaw),
      sourceLabel,
    };
  }

  const workflowEntry = byName.get('workflow.yml');
  if (!workflowEntry) {
    throw new CliError(`Workflow '${metadata.name}' is missing workflow.yml in '${sourceLabel}'.`);
  }

  return {
    metadata,
    readme,
    workflow: await readContent(workflowEntry),
    sourceLabel,
  };
}

export async function fetchGitHubWorkflowBundle(
  source: Extract<InstallSource, { kind: 'github' }>,
  requestedWorkflow?: string,
): Promise<WorkflowBundle> {
  const sourceLabel = `${source.owner}/${source.repo}`;
  const rootEntries = await fetchContents(source.owner, source.repo);

  if (rootEntries.some((entry) => entry.name === 'metadata.json')) {
    const bundle = await loadBundleFromDirectory(source.owner, source.repo, '', sourceLabel);
    if (requestedWorkflow && requestedWorkflow !== bundle.metadata.name) {
      throw new CliError(`Workflow '${requestedWorkflow}' not found in '${sourceLabel}'.`);
    }
    return bundle;
  }

  const workflowsEntry = rootEntries.find((entry) => entry.type === 'dir' && entry.name === 'workflows');
  if (!workflowsEntry) {
    throw new CliError(`No OpenCI workflows found in '${sourceLabel}'.`);
  }

  const workflowDirs = (await fetchContents(source.owner, source.repo, 'workflows')).filter(
    (entry) => entry.type === 'dir',
  );

  if (requestedWorkflow) {
    const match = workflowDirs.find((entry) => entry.name === requestedWorkflow);
    if (!match) {
      throw new CliError(`Workflow '${requestedWorkflow}' not found in '${sourceLabel}'.`);
    }

    return loadBundleFromDirectory(source.owner, source.repo, match.path, sourceLabel);
  }

  if (workflowDirs.length !== 1) {
    throw new CliError(`Multiple workflows found in '${sourceLabel}'. Use owner/repo#workflow-name.`);
  }

  return loadBundleFromDirectory(source.owner, source.repo, workflowDirs[0]!.path, sourceLabel);
}
