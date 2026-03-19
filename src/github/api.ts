import { execFileSync } from "node:child_process";

let cachedGhToken: string | undefined | null = null;

function getGitHubApiBaseUrl(): string {
  return (process.env.OPENCI_GITHUB_API_URL ?? "https://api.github.com").replace(/\/$/, "");
}

export function getGhToken(): string | undefined {
  if (cachedGhToken !== null) return cachedGhToken || undefined;

  const envToken = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (envToken) {
    cachedGhToken = envToken;
    return envToken;
  }

  try {
    const token = execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    cachedGhToken = token || "";
    return token || undefined;
  } catch {
    cachedGhToken = "";
    return undefined;
  }
}

export async function githubApiFetch(
  apiPath: string,
  options?: { skipAuth?: boolean },
): Promise<Response | undefined> {
  if (process.env.OPENCI_NO_API) return undefined;

  const url = apiPath.startsWith("http") ? apiPath : `${getGitHubApiBaseUrl()}${apiPath}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "openci-cli",
  };

  if (!options?.skipAuth) {
    const token = getGhToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
    if (response.status === 401 && !options?.skipAuth && headers.Authorization) {
      return githubApiFetch(apiPath, { skipAuth: true });
    }
    if (!response.ok) return undefined;
    return response;
  } catch {
    return undefined;
  }
}
