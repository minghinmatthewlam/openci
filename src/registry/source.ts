import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { CliError } from "../core/errors.js";
import { githubApiFetch } from "../github/api.js";
import { parseGitHubRepoRef } from "../github/identity.js";
import { tryGit } from "../utils/git.js";
import { computeHash, isWorkflowFile, stemName } from "../utils/workflow.js";
import { cloneGitRepo } from "./github.js";

export interface WorkflowFile {
  name: string;
  filename: string;
  content: string;
  contentHash: string;
  source: string;
  commit?: string;
}

export interface AvailableWorkflow {
  name: string;
  filename: string;
}

type InstallSource =
  | { kind: "local"; root: string; sourceLabel: string }
  | {
      kind: "git";
      repoUrl: string;
      fallbackRepoUrls?: string[];
      sourceLabel: string;
    };

interface GitHubSource {
  owner: string;
  repo: string;
}

// ── GitHub API fast path ──

function parseGitHubShorthand(input: string): GitHubSource | undefined {
  if (isLocalPath(input) || isGitUrl(input)) return undefined;
  return parseGitHubRepoRef(input);
}

async function tryListViaApi(
  gh: GitHubSource,
  _sourceLabel: string,
): Promise<AvailableWorkflow[] | undefined> {
  const res = await githubApiFetch(`/repos/${gh.owner}/${gh.repo}/contents/.github/workflows`);
  if (!res) return undefined;

  const entries = (await res.json()) as Array<{ name: string; type: string }>;
  if (!Array.isArray(entries)) return undefined;

  return entries
    .filter((e) => e.type === "file" && isWorkflowFile(e.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => ({ name: stemName(e.name), filename: e.name }));
}

async function tryFetchViaApi(
  gh: GitHubSource,
  workflow: string,
  sourceLabel: string,
): Promise<WorkflowFile | undefined> {
  const stem = stemName(workflow);

  // Try .yml first, then .yaml
  let res = await githubApiFetch(
    `/repos/${gh.owner}/${gh.repo}/contents/.github/workflows/${stem}.yml`,
  );
  let filename = `${stem}.yml`;
  if (!res) {
    res = await githubApiFetch(
      `/repos/${gh.owner}/${gh.repo}/contents/.github/workflows/${stem}.yaml`,
    );
    filename = `${stem}.yaml`;
  }
  if (!res) return undefined;

  const data = (await res.json()) as { content?: string; encoding?: string; name?: string };
  if (!data.content || data.encoding !== "base64") return undefined;

  const content = Buffer.from(data.content, "base64").toString("utf8");

  // Get commit SHA
  let commit: string | undefined;
  const commitRes = await githubApiFetch(`/repos/${gh.owner}/${gh.repo}/commits?per_page=1`);
  if (commitRes) {
    const commits = (await commitRes.json()) as Array<{ sha: string }>;
    if (Array.isArray(commits) && commits[0]?.sha) {
      commit = commits[0].sha;
    }
  }

  return {
    name: stem,
    filename: data.name ?? filename,
    content,
    contentHash: computeHash(content),
    source: sourceLabel,
    ...(commit ? { commit } : {}),
  };
}

// ── Source parsing ──

function isLocalPath(input: string): boolean {
  return (
    input === "." ||
    input.startsWith("./") ||
    input.startsWith("../") ||
    input.startsWith("/") ||
    input.startsWith("~")
  );
}

function isGitUrl(input: string): boolean {
  return (
    input.startsWith("git@") ||
    input.startsWith("git://") ||
    input.startsWith("ssh://") ||
    input.startsWith("https://") ||
    input.startsWith("http://") ||
    input.startsWith("file://")
  );
}

function parseSource(input: string, cwd: string): InstallSource {
  if (isLocalPath(input)) {
    const normalized = input.startsWith("~/")
      ? path.join(process.env.HOME ?? "", input.slice(2))
      : input;
    const root = path.resolve(cwd, normalized);
    return { kind: "local", root, sourceLabel: root };
  }

  if (isGitUrl(input)) {
    return { kind: "git", repoUrl: input, sourceLabel: input };
  }

  const repo = parseGitHubRepoRef(input);
  if (repo) {
    return {
      kind: "git",
      repoUrl: `https://github.com/${repo.owner}/${repo.repo}.git`,
      fallbackRepoUrls: [`git@github.com:${repo.owner}/${repo.repo}.git`],
      sourceLabel: `${repo.owner}/${repo.repo}`,
    };
  }

  throw new CliError(
    `Unsupported source '${input}'. Use owner/repo, github:owner/repo, a git URL, or a local path.`,
  );
}

// ── Clone fallback helpers ──

async function findWorkflowsDir(root: string, displayLabel = root): Promise<string> {
  const dir = path.join(root, ".github", "workflows");
  try {
    await access(dir);
    return dir;
  } catch {
    throw new CliError(`No .github/workflows/ directory found in '${displayLabel}'.`);
  }
}

async function listWorkflowFiles(workflowsDir: string): Promise<AvailableWorkflow[]> {
  const entries = await readdir(workflowsDir);
  return entries
    .filter(isWorkflowFile)
    .sort()
    .map((filename) => ({ name: stemName(filename), filename }));
}

// ── Public API ──

export async function listAvailableWorkflows(params: {
  cwd: string;
  sourceArg: string;
}): Promise<{ workflows: AvailableWorkflow[]; cleanup?: () => Promise<void> }> {
  const source = parseSource(params.sourceArg, params.cwd);

  if (source.kind === "local") {
    const dir = await findWorkflowsDir(source.root, source.sourceLabel);
    return { workflows: await listWorkflowFiles(dir) };
  }

  // Try GitHub API fast path
  const gh = parseGitHubShorthand(params.sourceArg);
  if (gh) {
    const workflows = await tryListViaApi(gh, source.sourceLabel);
    if (workflows) return { workflows };
    // API returned undefined — fall back to clone
  }

  const cloned = await cloneGitRepo(source);
  try {
    const dir = await findWorkflowsDir(cloned.path, source.sourceLabel);
    return { workflows: await listWorkflowFiles(dir), cleanup: cloned.cleanup };
  } catch (error) {
    await cloned.cleanup();
    throw error;
  }
}

export async function fetchWorkflowFile(params: {
  cwd: string;
  sourceArg: string;
  workflow: string;
}): Promise<{ file: WorkflowFile; cleanup?: () => Promise<void> }> {
  const source = parseSource(params.sourceArg, params.cwd);
  const stem = stemName(params.workflow);

  if (source.kind === "local") {
    return { file: await resolveFromClonePath(source.root, stem, source.sourceLabel) };
  }

  // Try GitHub API fast path
  const gh = parseGitHubShorthand(params.sourceArg);
  if (gh) {
    const file = await tryFetchViaApi(gh, params.workflow, source.sourceLabel);
    if (file) return { file };

    // Check if it's a 404 (workflow not found) — list available to show suggestions
    const available = await tryListViaApi(gh, source.sourceLabel);
    if (available !== undefined) {
      // API works but workflow wasn't found — throw with suggestions
      const names = available.map((w) => w.name);
      const suggestion =
        names.length > 0
          ? `\n\nAvailable workflows:\n${names.map((n) => `  ${n}`).join("\n")}`
          : "";
      throw new CliError(`Workflow '${stem}' not found in ${source.sourceLabel}.${suggestion}`);
    }
    // API completely failed — fall back to clone
  }

  const cloned = await cloneGitRepo(source);
  try {
    const file = await resolveFromClonePath(cloned.path, stem, source.sourceLabel);
    return { file, cleanup: cloned.cleanup };
  } catch (error) {
    await cloned.cleanup();
    throw error;
  }
}

async function resolveFromClonePath(
  root: string,
  stem: string,
  sourceLabel: string,
): Promise<WorkflowFile> {
  const dir = await findWorkflowsDir(root, sourceLabel);
  return resolveFromDir(dir, stem, sourceLabel, root);
}

async function resolveFromDir(
  dir: string,
  stem: string,
  sourceLabel: string,
  gitRoot: string,
): Promise<WorkflowFile> {
  const available = await listWorkflowFiles(dir);
  const found = available.find((w) => w.name === stem);
  if (!found) {
    const names = available.map((w) => w.name);
    const suggestion =
      names.length > 0 ? `\n\nAvailable workflows:\n${names.map((n) => `  ${n}`).join("\n")}` : "";
    throw new CliError(`Workflow '${stem}' not found in ${sourceLabel}.${suggestion}`);
  }
  const content = await readFile(path.join(dir, found.filename), "utf8");
  const commit = tryGit(["rev-parse", "HEAD"], gitRoot);
  return {
    name: found.name,
    filename: found.filename,
    content,
    contentHash: computeHash(content),
    source: sourceLabel,
    ...(commit ? { commit } : {}),
  };
}
