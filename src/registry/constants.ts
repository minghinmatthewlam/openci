export const OFFICIAL_REGISTRY = {
  owner: "minghinmatthewlam",
  repo: "openci",
  branch: "main",
} as const;

export const REGISTRY_TTL_MS = 60 * 60 * 1000;

export function officialRawUrl(path: string): string {
  const base = process.env.OPENCI_REGISTRY_URL;
  if (base) {
    return `${base.replace(/\/$/, "")}/${path}`;
  }

  return `https://raw.githubusercontent.com/${OFFICIAL_REGISTRY.owner}/${OFFICIAL_REGISTRY.repo}/${OFFICIAL_REGISTRY.branch}/${path}`;
}
