import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCatalogEntry, getCategories, listCatalogWorkflows, readCatalog } from "../lib/registry";

describe("catalog loader", () => {
  beforeEach(() => {
    process.env.OPENCI_CATALOG_PATH = "../catalog.json";
  });

  afterEach(() => {
    delete process.env.OPENCI_CATALOG_PATH;
  });

  it("loads the catalog document", () => {
    const catalog = readCatalog();

    expect(catalog.version).toBe(1);
    expect(catalog.workflows.length).toBeGreaterThan(0);
    expect(catalog.categories.length).toBeGreaterThan(0);
  });

  it("lists workflows alphabetically", () => {
    const workflows = listCatalogWorkflows();
    const names = workflows.map((w) => w.displayName);

    for (let i = 1; i < names.length; i++) {
      expect(names[i].localeCompare(names[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });

  it("filters by category", () => {
    const codeReview = listCatalogWorkflows(undefined, "code-review");

    expect(codeReview.length).toBeGreaterThan(0);
    expect(codeReview.every((w) => w.category === "code-review")).toBe(true);
  });

  it("filters by provider", () => {
    const claude = listCatalogWorkflows(undefined, "claude");

    expect(claude.length).toBeGreaterThan(0);
    expect(claude.every((w) => w.provider === "claude")).toBe(true);
  });

  it("searches by query string", () => {
    const results = listCatalogWorkflows("triage");

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (w) =>
          w.displayName.toLowerCase().includes("triage") ||
          w.description.toLowerCase().includes("triage") ||
          w.tags.some((t) => t.includes("triage")),
      ),
    ).toBe(true);
  });

  it("combines query and filter", () => {
    const results = listCatalogWorkflows("review", "claude");

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((w) => w.provider === "claude")).toBe(true);
  });

  it("gets a catalog entry by id", () => {
    const entry = getCatalogEntry("claude-code-assistant");

    expect(entry).toBeDefined();
    expect(entry!.displayName).toBe("Claude Code Assistant");
    expect(entry!.source).toBe("anthropics/claude-code");
    expect(entry!.provider).toBe("claude");
  });

  it("returns undefined for unknown id", () => {
    expect(getCatalogEntry("nonexistent")).toBeUndefined();
  });

  it("returns categories", () => {
    const categories = getCategories();

    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((c) => c.id === "code-review")).toBe(true);
    expect(categories.every((c) => c.displayName.length > 0)).toBe(true);
  });
});
