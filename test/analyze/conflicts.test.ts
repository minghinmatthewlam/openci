import { describe, expect, it } from "vitest";
import { extractTriggers, findConflicts } from "../../src/analyze/conflicts.js";

describe("extractTriggers", () => {
  it("extracts block-style triggers", () => {
    const yaml = `
on:
  pull_request:
    types: [opened]
  push:
    branches: [main]
`;
    const triggers = extractTriggers(yaml);
    expect(triggers).toEqual([{ event: "pull_request" }, { event: "push" }]);
  });

  it("extracts inline array triggers", () => {
    const yaml = `on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
`;
    const triggers = extractTriggers(yaml);
    expect(triggers).toEqual([{ event: "push" }, { event: "pull_request" }]);
  });

  it("extracts single inline trigger", () => {
    const yaml = `on: push
jobs:
  test:
    runs-on: ubuntu-latest
`;
    const triggers = extractTriggers(yaml);
    expect(triggers).toEqual([{ event: "push" }]);
  });

  it("handles issues trigger", () => {
    const yaml = `
on:
  issues:
    types: [opened]
`;
    const triggers = extractTriggers(yaml);
    expect(triggers).toEqual([{ event: "issues" }]);
  });

  it("returns empty array for no triggers", () => {
    const yaml = `
jobs:
  test:
    runs-on: ubuntu-latest
`;
    expect(extractTriggers(yaml)).toEqual([]);
  });
});

describe("findConflicts", () => {
  it("detects overlapping triggers", () => {
    const newTriggers = [{ event: "pull_request" }, { event: "push" }];
    const existing = [{ name: "ci", triggers: [{ event: "push" }, { event: "pull_request" }] }];
    const warnings = findConflicts(newTriggers, existing);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain("ci");
    expect(warnings[0]).toContain("push");
  });

  it("returns empty when no overlaps", () => {
    const newTriggers = [{ event: "issues" }];
    const existing = [{ name: "ci", triggers: [{ event: "push" }] }];
    const warnings = findConflicts(newTriggers, existing);
    expect(warnings).toEqual([]);
  });

  it("handles multiple existing workflows with overlaps", () => {
    const newTriggers = [{ event: "push" }];
    const existing = [
      { name: "ci", triggers: [{ event: "push" }] },
      { name: "deploy", triggers: [{ event: "push" }] },
    ];
    const warnings = findConflicts(newTriggers, existing);
    expect(warnings.length).toBe(2);
  });
});
