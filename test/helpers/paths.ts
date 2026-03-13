import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
export const workspaceRoot = join(currentDir, "..", "..");
export const fixturesRoot = join(currentDir, "..", "fixtures");
export const sourceRepoFixture = join(fixturesRoot, "source-repo");
