import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  detectionFixture,
  localRegistryRoot,
  makeTempRepo,
  normalizeTempPath,
  runCli,
} from "./helpers.js";

describe("integration: non-interactive contract", () => {
  it("keeps stdout machine-clean for add --yes --dry-run", () => {
    const repo = makeTempRepo({ fixturePath: detectionFixture("pnpm-next") });
    const result = runCli(
      ["add", localRegistryRoot(), "--workflow", "pr-review", "--yes", "--dry-run"],
      {
        cwd: repo,
      },
    );

    const targetPath = join(repo, ".github", "workflows", "pr-review.yml");

    expect(result.status).toBe(0);
    expect(normalizeTempPath(result.stdout.trim())).toBe(normalizeTempPath(targetPath));
    expect(result.stderr).toContain("Required secret: ANTHROPIC_API_KEY");
    expect(existsSync(targetPath)).toBe(false);
  });

  it("keeps stdout machine-clean for create --yes", () => {
    const repo = makeTempRepo();
    const result = runCli(["create", "my-workflow", "--smart", "--yes"], {
      cwd: repo,
    });

    expect(result.status).toBe(0);
    expect(normalizeTempPath(result.stdout.trim())).toBe(
      normalizeTempPath(join(repo, "workflows", "my-workflow")),
    );
    expect(result.stderr).toBe("");
  });
});
