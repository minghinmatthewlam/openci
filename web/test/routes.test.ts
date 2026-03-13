import { beforeEach, describe, expect, it } from "vitest";
import HomePage from "../app/page";
import DocsPage from "../app/docs/page";
import CatalogDetailPage from "../app/catalog/[id]/page";

describe("route components", () => {
  beforeEach(() => {
    process.env.OPENCI_CATALOG_PATH = "../catalog.json";
  });

  it("renders the homepage tree", async () => {
    const page = await HomePage({ searchParams: Promise.resolve({}) });
    expect(page).toBeTruthy();
  });

  it("renders homepage with filter", async () => {
    const page = await HomePage({ searchParams: Promise.resolve({ filter: "claude" }) });
    expect(page).toBeTruthy();
  });

  it("renders homepage with search", async () => {
    const page = await HomePage({ searchParams: Promise.resolve({ q: "review" }) });
    expect(page).toBeTruthy();
  });

  it("renders docs", () => {
    expect(DocsPage()).toBeTruthy();
  });

  it("renders a catalog detail page", async () => {
    const page = await CatalogDetailPage({
      params: Promise.resolve({ id: "claude-code-assistant" }),
    });
    expect(page).toBeTruthy();
  });
});
