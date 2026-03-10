import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { ZodType } from 'zod';
import { CliError } from '../core/errors.js';

let ghTokenCache: string | null | undefined;

function readGhToken(): string | undefined {
  if (ghTokenCache !== undefined) {
    return ghTokenCache ?? undefined;
  }

  const result = spawnSync('gh', ['auth', 'token'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  const token = result.status === 0 ? result.stdout.trim() : '';
  ghTokenCache = token || null;
  return ghTokenCache ?? undefined;
}

function getGithubToken(): string | undefined {
  return process.env.GITHUB_TOKEN?.trim() || readGhToken();
}

function isGithubRequest(url: URL): boolean {
  return url.hostname === 'api.github.com' || url.hostname === 'raw.githubusercontent.com';
}

function getAuthHeaders(url: URL): Record<string, string> {
  if (!isGithubRequest(url)) {
    return {};
  }

  const token = getGithubToken();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function fetchRaw(url: string, accept?: string): Promise<string> {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol === 'file:') {
    try {
      return await readFile(fileURLToPath(parsedUrl), 'utf8');
    } catch {
      throw new CliError('Could not reach registry. Check your connection.');
    }
  }

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        'user-agent': 'openci-cli',
        ...(accept ? { Accept: accept } : {}),
        ...getAuthHeaders(parsedUrl),
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new CliError('Could not reach registry. Check your connection.');
  }

  if (!response.ok) {
    throw new CliError('Could not reach registry. Check your connection.');
  }

  return response.text();
}

export async function fetchJson<T>(url: string, schema: ZodType<T>): Promise<T> {
  const raw = await fetchRaw(url, 'application/json');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CliError(`Invalid JSON response from '${url}'.`);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new CliError(`Invalid JSON response from '${url}'.`);
  }

  return result.data;
}

export function fetchText(url: string): Promise<string> {
  return fetchRaw(url);
}
