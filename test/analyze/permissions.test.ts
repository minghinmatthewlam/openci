import { describe, expect, it } from "vitest";
import { extractPermissions } from "../../src/analyze/permissions.js";

describe("extractPermissions", () => {
  it("extracts block permissions", () => {
    const yaml = `
permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  test:
    runs-on: ubuntu-latest
`;
    expect(extractPermissions(yaml)).toEqual({
      contents: "read",
      "pull-requests": "write",
      issues: "write",
    });
  });

  it("extracts inline global permissions", () => {
    const yaml = `
permissions: read-all

jobs:
  test:
    runs-on: ubuntu-latest
`;
    expect(extractPermissions(yaml)).toEqual({ _global: "read-all" });
  });

  it("returns empty object when no permissions", () => {
    const yaml = `
on: push
jobs:
  test:
    runs-on: ubuntu-latest
`;
    expect(extractPermissions(yaml)).toEqual({});
  });

  it("skips comments inside permissions block", () => {
    const yaml = `
permissions:
  # needed for checkout
  contents: read
  pull-requests: write
`;
    expect(extractPermissions(yaml)).toEqual({
      contents: "read",
      "pull-requests": "write",
    });
  });
});
