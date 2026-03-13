import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { CliError } from "../core/errors.js";
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
  | { kind: "git"; repoUrl: string; sourceLabel: string };

const GITHUB_SOURCE_RE =
  /^(?:github:)?(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+?)(?:\.git)?$/;

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
    input.startsWith("file://") ||
    input.endsWith(".git")
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

  const match = input.match(GITHUB_SOURCE_RE);
  if (match?.groups?.owner && match.groups.repo) {
    return {
      kind: "git",
      repoUrl: `https://github.com/${match.groups.owner}/${match.groups.repo}.git`,
      sourceLabel: `${match.groups.owner}/${match.groups.repo}`,
    };
  }

  if (isGitUrl(input)) {
    return { kind: "git", repoUrl: input, sourceLabel: input };
  }

  throw new CliError(
    `Unsupported source '${input}'. Use owner/repo, github:owner/repo, a git URL, or a local path.`,
  );
}

function getCommitSha(repoDir: string): string | undefined {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

function computeHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function isWorkflowFile(filename: string): boolean {
  return filename.endsWith(".yml") || filename.endsWith(".yaml");
}

function stemName(filename: string): string {
  return filename.replace(/\.ya?ml$/, "");
}

async function findWorkflowsDir(root: string): Promise<string> {
  const dir = path.join(root, ".github", "workflows");
  try {
    await access(dir);
    return dir;
  } catch {
    throw new CliError(`No .github/workflows/ directory found in '${root}'.`);
  }
}

async function listWorkflowFiles(workflowsDir: string): Promise<AvailableWorkflow[]> {
  const entries = await readdir(workflowsDir);
  return entries
    .filter(isWorkflowFile)
    .sort()
    .map((filename) => ({ name: stemName(filename), filename }));
}

export async function listAvailableWorkflows(params: {
  cwd: string;
  sourceArg: string;
}): Promise<{ workflows: AvailableWorkflow[]; cleanup?: () => Promise<void> }> {
  const source = parseSource(params.sourceArg, params.cwd);

  if (source.kind === "local") {
    const dir = await findWorkflowsDir(source.root);
    return { workflows: await listWorkflowFiles(dir) };
  }

  const cloned = await cloneGitRepo(source);
  try {
    const dir = await findWorkflowsDir(cloned.path);
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

  async function resolveFromRoot(root: string, sourceLabel: string): Promise<WorkflowFile> {
    const dir = await findWorkflowsDir(root);
    const available = await listWorkflowFiles(dir);
    const match = available.find((w) => w.name === stem);
    if (!match) {
      const names = available.map((w) => w.name);
      const suggestion =
        names.length > 0
          ? `\n\nAvailable workflows:\n${names.map((n) => `  ${n}`).join("\n")}`
          : "";
      throw new CliError(`Workflow '${stem}' not found in ${sourceLabel}.${suggestion}`);
    }
    const content = await readFile(path.join(dir, match.filename), "utf8");
    return {
      name: match.name,
      filename: match.filename,
      content,
      contentHash: computeHash(content),
      source: sourceLabel,
      commit: getCommitSha(root),
    };
  }

  if (source.kind === "local") {
    return { file: await resolveFromRoot(source.root, source.sourceLabel) };
  }

  const cloned = await cloneGitRepo(source);
  try {
    const file = await resolveFromRoot(cloned.path, source.sourceLabel);
    return { file, cleanup: cloned.cleanup };
  } catch (error) {
    await cloned.cleanup();
    throw error;
  }
}
