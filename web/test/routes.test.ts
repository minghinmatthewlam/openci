import { describe, expect, it } from "vitest";
import HomePage from "../app/page";
import DocsPage from "../app/docs/page";
import WorkflowDetailPage from "../app/[author]/[name]/page";

describe("route components", () => {
  it("renders the homepage tree", async () => {
    const page = await HomePage({ searchParams: Promise.resolve({}) });
    expect(page).toBeTruthy();
  });

  it("renders docs", () => {
    expect(DocsPage()).toBeTruthy();
  });

  it("renders a workflow detail page", async () => {
    const page = await WorkflowDetailPage({
      params: Promise.resolve({ author: "openci", name: "pr-review" }),
    });

    expect(page).toBeTruthy();
  });
});
