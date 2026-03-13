#!/usr/bin/env node

/**
 * Generates registry.json and web/data/registry/ from the canonical
 * workflows/\*\/metadata.json source. Run with --check to verify
 * that generated files match the current state (used in CI).
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOWS_DIR = join(ROOT, "workflows");
const REGISTRY_PATH = join(ROOT, "registry.json");
const WEB_REGISTRY_DIR = join(ROOT, "web", "data", "registry");
const WEB_WORKFLOWS_DIR = join(WEB_REGISTRY_DIR, "workflows");

const checkMode = process.argv.includes("--check");

// Read existing registry.json for version and updatedAt
const existingRegistry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));

// Discover workflow directories (skip empty ones like my-workflow)
const workflowDirs = readdirSync(WORKFLOWS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => existsSync(join(WORKFLOWS_DIR, name, "metadata.json")));

// Read and validate all metadata
const workflows = [];
for (const name of workflowDirs) {
  const metadataPath = join(WORKFLOWS_DIR, name, "metadata.json");
  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));

  if (metadata.name !== name) {
    console.error(`ERROR: ${metadataPath} has name "${metadata.name}" but directory is "${name}"`);
    process.exit(1);
  }

  workflows.push(metadata);
}

// Sort alphabetically for consistent ordering
workflows.sort((a, b) => a.name.localeCompare(b.name));

// Generate registry.json entries (subset of metadata fields)
const REGISTRY_FIELDS = [
  "name",
  "displayName",
  "description",
  "tags",
  "provider",
  "runtimes",
  "runners",
  "defaultRuntime",
  "defaultRunner",
  "smart",
  "stacks",
  "author",
  "repository",
  "publishedAt",
];

const registryWorkflows = workflows.map((meta) => {
  const entry = {};
  for (const field of REGISTRY_FIELDS) {
    if (meta[field] !== undefined) {
      entry[field] = meta[field];
    }
  }
  return entry;
});

const registryJson = {
  version: existingRegistry.version,
  updatedAt: existingRegistry.updatedAt,
  workflows: registryWorkflows,
};

const registryContent = JSON.stringify(registryJson, null, 2) + "\n";

// Collect all generated files for check or write
const generated = new Map();
generated.set(REGISTRY_PATH, registryContent);
generated.set(join(WEB_REGISTRY_DIR, "registry.json"), registryContent);

for (const name of workflowDirs) {
  const srcDir = join(WORKFLOWS_DIR, name);
  const dstDir = join(WEB_WORKFLOWS_DIR, name);

  // Copy metadata.json
  const metadataContent = readFileSync(join(srcDir, "metadata.json"), "utf8");
  generated.set(join(dstDir, "metadata.json"), metadataContent);

  // Copy README.md if it exists
  const readmePath = join(srcDir, "README.md");
  if (existsSync(readmePath)) {
    generated.set(join(dstDir, "README.md"), readFileSync(readmePath, "utf8"));
  }
}

// Detect stale workflow directories in web that no longer exist in source
const sourceSet = new Set(workflowDirs);
const staleWebDirs = existsSync(WEB_WORKFLOWS_DIR)
  ? readdirSync(WEB_WORKFLOWS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !sourceSet.has(d.name))
      .map((d) => d.name)
  : [];

if (checkMode) {
  let drifted = false;
  for (const [filePath, expected] of generated) {
    if (!existsSync(filePath)) {
      console.error(`MISSING: ${filePath}`);
      drifted = true;
      continue;
    }
    const actual = readFileSync(filePath, "utf8");
    if (actual !== expected) {
      console.error(`DRIFT: ${filePath}`);
      drifted = true;
    }
  }

  for (const name of staleWebDirs) {
    console.error(`STALE: ${join(WEB_WORKFLOWS_DIR, name)} (no source workflow)`);
    drifted = true;
  }

  if (drifted) {
    console.error("\nRegistry data is out of sync. Run: npm run sync:registry");
    process.exit(1);
  }

  console.log("Registry data is in sync.");
} else {
  for (const [filePath, content] of generated) {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, "utf8");
  }

  for (const name of staleWebDirs) {
    const stalePath = join(WEB_WORKFLOWS_DIR, name);
    rmSync(stalePath, { recursive: true });
    console.log(`Removed stale: ${stalePath}`);
  }

  console.log(`Synced ${generated.size} files from ${workflowDirs.length} workflows.`);
}
