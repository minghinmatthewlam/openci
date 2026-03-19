import { githubApiFetch } from "./api.js";
import { getGitRemoteUrl } from "../utils/git.js";
import { stemName } from "../utils/workflow.js";

export interface GitHubRepoRef {
  owner: string;
  repo: string;
}

const GITHUB_SHORTHAND_RE =
  /^(?:github:)?(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+?)(?:\.git)?$/;

export function parseGitHubRepoRef(input: string | undefined): GitHubRepoRef | undefined {
  if (!input) return undefined;

  const shorthandMatch = input.match(GITHUB_SHORTHAND_RE);
  if (shorthandMatch?.groups?.owner && shorthandMatch.groups.repo) {
    return { owner: shorthandMatch.groups.owner, repo: shorthandMatch.groups.repo };
  }

  const sshMatch = input.match(/^git@github\.com:(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/);
  if (sshMatch?.groups?.owner && sshMatch.groups.repo) {
    return { owner: sshMatch.groups.owner, repo: sshMatch.groups.repo };
  }

  const sshUrlMatch = input.match(
    /^ssh:\/\/git@github\.com\/(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,
  );
  if (sshUrlMatch?.groups?.owner && sshUrlMatch.groups.repo) {
    return { owner: sshUrlMatch.groups.owner, repo: sshUrlMatch.groups.repo };
  }

  const httpsMatch = input.match(
    /^https?:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,
  );
  if (httpsMatch?.groups?.owner && httpsMatch.groups.repo) {
    return { owner: httpsMatch.groups.owner, repo: httpsMatch.groups.repo };
  }

  return undefined;
}

export function buildWorkflowSlug(
  source: string | undefined,
  workflowName: string | undefined,
): string | undefined {
  if (!source || !workflowName) return undefined;
  const repo = parseGitHubRepoRef(source);
  if (!repo) return undefined;
  return `github/${repo.owner}/${repo.repo}/${stemName(workflowName)}`;
}

export function getDestinationRepoIdentity(repoRoot: string): string | undefined {
  const remoteUrl = getGitRemoteUrl(repoRoot);
  const repo = parseGitHubRepoRef(remoteUrl);
  if (!repo) return undefined;
  return `${repo.owner}/${repo.repo}`;
}

export type DestinationRepoVisibility = "public" | "private" | "unknown";

export async function getGitHubRepoVisibility(
  repo: GitHubRepoRef,
): Promise<DestinationRepoVisibility> {
  const response = await githubApiFetch(`/repos/${repo.owner}/${repo.repo}`);
  if (!response) return "unknown";

  const data = (await response.json()) as { private?: boolean };
  if (typeof data.private !== "boolean") return "unknown";
  return data.private ? "private" : "public";
}

export async function getDestinationRepoVisibility(
  repoRoot: string,
): Promise<DestinationRepoVisibility> {
  const remoteUrl = getGitRemoteUrl(repoRoot);
  const repo = parseGitHubRepoRef(remoteUrl);
  if (!repo) return "unknown";
  return getGitHubRepoVisibility(repo);
}
