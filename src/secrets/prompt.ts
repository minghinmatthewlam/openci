export interface GithubRemote {
  owner: string;
  repo: string;
}

export function parseGithubRemote(remoteUrl: string | undefined): GithubRemote | undefined {
  if (!remoteUrl) return undefined;
  const sshMatch = remoteUrl.match(/^git@github\.com:(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/);
  if (sshMatch?.groups?.owner && sshMatch.groups.repo) {
    return { owner: sshMatch.groups.owner, repo: sshMatch.groups.repo };
  }
  const httpsMatch = remoteUrl.match(
    /^https:\/\/github\.com\/(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,
  );
  if (httpsMatch?.groups?.owner && httpsMatch.groups.repo) {
    return { owner: httpsMatch.groups.owner, repo: httpsMatch.groups.repo };
  }
  return undefined;
}

export function buildSecretInstructions(
  secrets: string[],
  repoRemoteUrl: string | undefined,
  ghReady: boolean,
): string[] {
  if (secrets.length === 0) return [];
  const repo = parseGithubRemote(repoRemoteUrl);
  return secrets.flatMap((secret) => {
    const lines = [`Required secret: ${secret}`];
    if (ghReady) {
      lines.push(`  Run: gh secret set ${secret}`);
    } else if (repo) {
      lines.push(
        `  Visit: https://github.com/${repo.owner}/${repo.repo}/settings/secrets/actions/new`,
      );
    } else {
      lines.push("  Install and authenticate gh CLI for easier secret setup.");
    }
    return lines;
  });
}
