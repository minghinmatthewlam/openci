import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { detectPackageManager } from "../../src/detection/package-manager.js";
import { detectionFixturesRoot } from "../helpers/paths.js";

describe("detectPackageManager", () => {
  it("prefers pnpm when conflicting lockfiles exist", async () => {
    await expect(detectPackageManager(join(detectionFixturesRoot, "pnpm-next"))).resolves.toBe(
      "pnpm",
    );
  });

  it("falls back to npm when no lockfile is present", async () => {
    await expect(
      detectPackageManager(join(detectionFixturesRoot, "no-package-json")),
    ).resolves.toBe("npm");
  });
});
