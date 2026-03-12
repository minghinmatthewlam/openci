import { join } from "node:path";
import { CliError } from "../core/errors.js";
import { readJsonIfFresh, writeJson, getCacheRoot } from "../utils/cache.js";
import { fetchJson } from "../utils/http.js";
import { OFFICIAL_REGISTRY, REGISTRY_TTL_MS, officialRawUrl } from "./constants.js";
import { RegistrySchema, type Registry } from "./schemas.js";

export function getRegistryCachePath(): string {
  return join(getCacheRoot(), "registry.json");
}

export async function fetchRegistry(options?: { fresh?: boolean }): Promise<Registry> {
  const cachePath = getRegistryCachePath();

  if (!options?.fresh) {
    const cached = await readJsonIfFresh(cachePath, REGISTRY_TTL_MS);
    if (cached) {
      const parsed = RegistrySchema.safeParse(cached);
      if (parsed.success) {
        return parsed.data;
      }
    }
  }

  try {
    const registry = await fetchJson(officialRawUrl("registry.json"), RegistrySchema);
    await writeJson(cachePath, registry);
    return registry;
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }

    throw new CliError("Could not reach registry. Check your connection.");
  }
}

export function getOfficialWorkflowBasePath(name: string): string {
  return `workflows/${name}`;
}

export function getOfficialWorkflowFileUrl(name: string, fileName: string): string {
  return officialRawUrl(`${getOfficialWorkflowBasePath(name)}/${fileName}`);
}

export function getOfficialRegistryLabel(): string {
  return `${OFFICIAL_REGISTRY.owner}/${OFFICIAL_REGISTRY.repo}`;
}
