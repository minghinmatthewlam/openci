import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const helpersDir = fileURLToPath(new URL(".", import.meta.url));

export const workspaceRoot = join(helpersDir, "..", "..");
export const fixturesRoot = join(workspaceRoot, "test", "fixtures");
export const detectionFixturesRoot = join(fixturesRoot, "detection");
export const registryFixturesRoot = join(fixturesRoot, "registry");
export const registryFixturesUrl = pathToFileURL(registryFixturesRoot).href;

export function detectionFixturePath(name: string): string {
  return join(detectionFixturesRoot, name);
}
