import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { detectFramework } from "../../src/detection/framework.js";
import { readPackageJson } from "../../src/utils/package-json.js";

const fixturesRoot = "/Users/matthewlam/dev/openci/test/fixtures/detection";

describe("detectFramework", () => {
  it("prioritizes Next.js over React when both are present", async () => {
    const packageJson = await readPackageJson(join(fixturesRoot, "pnpm-next"));

    expect(detectFramework(packageJson)).toBe("Next.js");
  });

  it("detects Vue projects", async () => {
    const packageJson = await readPackageJson(join(fixturesRoot, "yarn-vue"));

    expect(detectFramework(packageJson)).toBe("Vue");
  });
});
