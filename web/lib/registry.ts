import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface CatalogEntry {
  id: string;
  displayName: string;
  description: string;
  source: string;
  workflow: string;
  provider: string;
  category: string;
  tags: string[];
  sourceUrl: string;
  triggers: string[];
  secrets: string[];
  highlights: string[];
  addedAt: string;
}

export interface Category {
  id: string;
  displayName: string;
}

export interface Catalog {
  version: number;
  updatedAt: string;
  categories: Category[];
  workflows: CatalogEntry[];
}

let catalogCache: Catalog | undefined;

function getCatalogPath(): string {
  const base = process.env.OPENCI_CATALOG_PATH ?? "catalog.json";
  return join(process.cwd(), base);
}

export function clearCatalogCache(): void {
  catalogCache = undefined;
}

export function readCatalog(): Catalog {
  if (catalogCache) return catalogCache;
  const raw = readFileSync(getCatalogPath(), "utf8");
  catalogCache = JSON.parse(raw) as Catalog;
  return catalogCache;
}

export function listCatalogWorkflows(query?: string, filter?: string): CatalogEntry[] {
  const catalog = readCatalog();
  let workflows = catalog.workflows;

  if (filter && filter !== "all") {
    workflows = workflows.filter((w) => w.category === filter || w.provider === filter);
  }

  if (query) {
    const q = query.toLowerCase();
    workflows = workflows.filter(
      (w) =>
        w.displayName.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.source.toLowerCase().includes(q) ||
        w.provider.toLowerCase().includes(q) ||
        w.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return workflows.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function getCatalogEntry(id: string): CatalogEntry | undefined {
  return readCatalog().workflows.find((w) => w.id === id);
}

export function getCategories(): Category[] {
  return readCatalog().categories;
}
