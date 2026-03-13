import { describe, expect, it } from "vitest";
import { hasTimeout } from "../../src/analyze/timeout.js";

describe("hasTimeout", () => {
  it("returns true when timeout-minutes is present", () => {
    const yaml = `
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
`;
    expect(hasTimeout(yaml)).toBe(true);
  });

  it("returns false when timeout-minutes is absent", () => {
    const yaml = `
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
`;
    expect(hasTimeout(yaml)).toBe(false);
  });
});
