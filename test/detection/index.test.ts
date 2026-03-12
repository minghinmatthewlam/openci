import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { detectRepo } from "../../src/detection/index.js";

const fixturesRoot = "/Users/matthewlam/dev/openci/test/fixtures/detection";

describe("detectRepo", () => {
  it("aggregates enabled detectors into a single result", async () => {
    const result = await detectRepo(join(fixturesRoot, "pnpm-next"), {
      packageManager: true,
      nodeVersion: true,
      defaultBranch: true,
      framework: true,
      validationCommand: true,
    });

    expect(result.packageManager).toBe("pnpm");
    expect(result.framework).toBe("Next.js");
    expect(result.validationCommand).toBe("pnpm check");
    expect(result.warnings).toEqual([]);
  });

  it("returns warnings instead of throwing when package.json parsing fails", async () => {
    const result = await detectRepo(join(fixturesRoot, "invalid-package-json"), {
      packageManager: true,
      nodeVersion: true,
      framework: true,
      validationCommand: true,
    });

    expect(result.packageManager).toBe("npm");
    expect(result.warnings[0]).toContain("Failed to detect package.json");
  });
});
