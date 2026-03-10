import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { CliError } from '../core/errors.js';
import { cloneGitRepo } from './github.js';
import { parseOpenCiConfig, type WorkflowBundle } from './resolve.js';
import { WorkflowMetadataSchema } from './schemas.js';

export type InstallSource =
  | { kind: 'local'; root: string }
  | { kind: 'git'; repoUrl: string; sourceLabel: string };

const GITHUB_SOURCE_RE = /^(?:github:)?(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+?)(?:\.git)?$/;

function parseWorkflowFragment(input: string): { source: string; workflowName?: string } {
  const hashIndex = input.lastIndexOf('#');
  if (hashIndex === -1) {
    return { source: input };
  }

  const source = input.slice(0, hashIndex);
  const workflowName = input.slice(hashIndex + 1).trim();

  return {
    source,
    ...(workflowName ? { workflowName } : {}),
  };
}

function isLocalPath(input: string): boolean {
  return (
    input === '.' ||
    input.startsWith('./') ||
    input.startsWith('../') ||
    input.startsWith('/') ||
    input.startsWith('~')
  );
}

function isGitUrl(input: string): boolean {
  return (
    input.startsWith('git@') ||
    input.startsWith('git://') ||
    input.startsWith('ssh://') ||
    input.startsWith('https://') ||
    input.startsWith('http://') ||
    input.startsWith('file://') ||
    input.endsWith('.git')
  );
}

function parseSource(input: string, cwd: string): InstallSource {
  const { source } = parseWorkflowFragment(input);

  if (isLocalPath(input)) {
    const normalized = source.startsWith('~/')
      ? path.join(process.env.HOME ?? '', source.slice(2))
      : source;

    return {
      kind: 'local',
      root: path.resolve(cwd, normalized),
    };
  }

  const match = source.match(GITHUB_SOURCE_RE);
  if (match?.groups?.owner && match.groups.repo) {
    return {
      kind: 'git',
      repoUrl: `https://github.com/${match.groups.owner}/${match.groups.repo}.git`,
      sourceLabel: `${match.groups.owner}/${match.groups.repo}`,
    };
  }

  if (isGitUrl(source)) {
    return {
      kind: 'git',
      repoUrl: source,
      sourceLabel: source,
    };
  }

  throw new CliError(
    `Unsupported source '${input}'. Use owner/repo, github:owner/repo, a git URL, or a local path.`,
  );
}

export function normalizeInstallRequest(params: {
  cwd: string;
  sourceArg?: string | undefined;
  workflow?: string | undefined;
}): { source: InstallSource; requestedWorkflow?: string | undefined } {
  if (!params.sourceArg) {
    throw new CliError('A source is required.');
  }

  const parsed = parseWorkflowFragment(params.sourceArg);
  const source = parseSource(parsed.source, params.cwd);
  const requestedWorkflow = params.workflow ?? parsed.workflowName;

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
  sourceArg?: string | undefined;
  workflow?: string | undefined;
}): Promise<{ bundle: WorkflowBundle; cleanup?: () => Promise<void> }> {
  const request = normalizeInstallRequest(params);

  switch (request.source.kind) {
    case 'local': {
      const dir = await resolveLocalWorkflowDir(request.source.root, request.requestedWorkflow);
      return {
        bundle: await loadWorkflowBundleFromDirectory(dir, request.source.root),
      };
    }
    case 'git': {
      const cloned = await cloneGitRepo(request.source);
      try {
        const dir = await resolveLocalWorkflowDir(cloned.path, request.requestedWorkflow);
        const bundle = await loadWorkflowBundleFromDirectory(dir, cloned.sourceLabel);
        return {
          bundle,
          cleanup: cloned.cleanup,
        };
      } catch (error) {
        await cloned.cleanup();
        throw error;
      }
    }
  }
}
