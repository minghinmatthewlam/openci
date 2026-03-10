import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { CliError } from '../core/errors.js';
import { fetchOfficialWorkflowBundle, parseOpenCiConfig, type WorkflowBundle } from './resolve.js';
import { WorkflowMetadataSchema } from './schemas.js';
import { fetchGitHubWorkflowBundle } from './github.js';

export type InstallSource =
  | { kind: 'official' }
  | { kind: 'local'; root: string; workflowName?: string | undefined }
  | { kind: 'github'; owner: string; repo: string; workflowName?: string | undefined };

const GITHUB_SOURCE_RE =
  /^(?:github:)?(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+?)(?:\.git)?(?:#(?<workflow>[a-z0-9-]+))?$/;

function isLocalPath(input: string): boolean {
  return (
    input === '.' ||
    input.startsWith('./') ||
    input.startsWith('../') ||
    input.startsWith('/') ||
    input.startsWith('~')
  );
}

function parseSource(input: string, cwd: string): InstallSource {
  if (isLocalPath(input)) {
    const normalized = input.startsWith('~/')
      ? path.join(process.env.HOME ?? '', input.slice(2))
      : input;

    return {
      kind: 'local',
      root: path.resolve(cwd, normalized),
    };
  }

  const match = input.match(GITHUB_SOURCE_RE);
  if (match?.groups?.owner && match.groups.repo) {
    const workflowName = match.groups.workflow;
    return {
      kind: 'github',
      owner: match.groups.owner,
      repo: match.groups.repo,
      ...(workflowName ? { workflowName } : {}),
    };
  }

  throw new CliError(
    `Unsupported source '${input}'. Use owner/repo, github:owner/repo, owner/repo#workflow-name, or a local path.`,
  );
}

export function normalizeInstallRequest(params: {
  cwd: string;
  workflowArg?: string | undefined;
  from?: string | undefined;
}): { source: InstallSource; requestedWorkflow?: string | undefined } {
  if (!params.from && !params.workflowArg) {
    throw new CliError('A workflow name is required.');
  }

  if (!params.from && params.workflowArg) {
    try {
      const source = parseSource(params.workflowArg, params.cwd);
      const requestedWorkflow = source.kind === 'official' ? params.workflowArg : source.workflowName;
      return {
        source,
        ...(requestedWorkflow ? { requestedWorkflow } : {}),
      };
    } catch {
      return {
        source: { kind: 'official' },
        ...(params.workflowArg ? { requestedWorkflow: params.workflowArg } : {}),
      };
    }
  }

  const source = parseSource(params.from!, params.cwd);
  const requestedWorkflow = source.kind === 'official' ? params.workflowArg : source.workflowName ?? params.workflowArg;
  return {
    source,
    ...(requestedWorkflow ? { requestedWorkflow } : {}),
  };
}

async function exists(pathname: string): Promise<boolean> {
  try {
    await access(pathname);
    return true;
  } catch {
    return false;
  }
}

async function resolveLocalWorkflowDir(root: string, requestedWorkflow?: string): Promise<string> {
  if (await exists(path.join(root, 'metadata.json'))) {
    return root;
  }

  const workflowsRoot = path.join(root, 'workflows');
  if (!(await exists(workflowsRoot))) {
    throw new CliError(`No OpenCI workflows found in '${root}'.`);
  }

  if (requestedWorkflow) {
    const candidate = path.join(workflowsRoot, requestedWorkflow);
    if (await exists(path.join(candidate, 'metadata.json'))) {
      return candidate;
    }

    throw new CliError(`Workflow '${requestedWorkflow}' not found in '${root}'.`);
  }

  const entries = await readdir(workflowsRoot, { withFileTypes: true });
  const candidates = entries.filter((entry) => entry.isDirectory());

  if (candidates.length === 1) {
    return path.join(workflowsRoot, candidates[0]!.name);
  }

  throw new CliError(`Multiple workflows found in '${root}'. Specify one explicitly.`);
}

async function loadWorkflowBundleFromDirectory(dir: string, sourceLabel: string): Promise<WorkflowBundle> {
  const metadataRaw = await readFile(path.join(dir, 'metadata.json'), 'utf8');
  const metadataResult = WorkflowMetadataSchema.safeParse(JSON.parse(metadataRaw));
  if (!metadataResult.success) {
    throw new CliError(`Invalid metadata in '${dir}'.`);
  }

  const readmePath = path.join(dir, 'README.md');
  const readme = (await exists(readmePath)) ? await readFile(readmePath, 'utf8') : '';

  if (metadataResult.data.smart) {
    const workflowTemplate = await readFile(path.join(dir, 'workflow.yml.tmpl'), 'utf8');
    const configRaw = await readFile(path.join(dir, 'openci.config.json'), 'utf8');

    return {
      metadata: metadataResult.data,
      readme,
      workflowTemplate,
      config: parseOpenCiConfig(metadataResult.data.name, configRaw),
      sourceLabel,
    };
  }

  return {
    metadata: metadataResult.data,
    readme,
    workflow: await readFile(path.join(dir, 'workflow.yml'), 'utf8'),
    sourceLabel,
  };
}

export async function resolveWorkflowBundle(params: {
  cwd: string;
  workflowArg?: string | undefined;
  from?: string | undefined;
}): Promise<WorkflowBundle> {
  const request = normalizeInstallRequest(params);

  switch (request.source.kind) {
    case 'official':
      if (!request.requestedWorkflow) {
        throw new CliError('A workflow name is required.');
      }
      return fetchOfficialWorkflowBundle(request.requestedWorkflow);
    case 'local': {
      const dir = await resolveLocalWorkflowDir(request.source.root, request.requestedWorkflow);
      return loadWorkflowBundleFromDirectory(dir, request.source.root);
    }
    case 'github':
      return fetchGitHubWorkflowBundle(request.source, request.requestedWorkflow);
  }
}
