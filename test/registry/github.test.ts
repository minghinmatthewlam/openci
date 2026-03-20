import { execFileSync } from "node:child_process";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cloneGitRepo } from "../../src/registry/github.js";

describe("cloneGitRepo", () => {
  let tempDir: string;
  let sourceRepo: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "openci-clone-test-"));
    sourceRepo = join(tempDir, "source");

    execFileSync("git", ["init", "--initial-branch=main", sourceRepo], { stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "test@test.com"], {
      cwd: sourceRepo,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.name", "Test"], {
      cwd: sourceRepo,
      stdio: "ignore",
    });

    await mkdir(join(sourceRepo, ".github", "workflows"), { recursive: true });
    await writeFile(join(sourceRepo, ".github", "workflows", "ci.yml"), "on: push\n", "utf8");
    execFileSync("git", ["add", "."], { cwd: sourceRepo, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", "init"], { cwd: sourceRepo, stdio: "ignore" });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("falls back to the next clone URL when the first one fails", async () => {
    const cloned = await cloneGitRepo({
      repoUrl: join(tempDir, "missing.git"),
      fallbackRepoUrls: [sourceRepo],
      sourceLabel: "owner/repo",
    });

    const workflowPath = join(cloned.path, ".github", "workflows", "ci.yml");
    await expect(access(workflowPath)).resolves.toBeUndefined();
    expect(cloned.sourceLabel).toBe("owner/repo");

    await cloned.cleanup();
    await expect(access(cloned.path)).rejects.toThrow();
  });
});
