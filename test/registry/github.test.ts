import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { cloneGitRepo } from "../../src/registry/github.js";

describe("cloneGitRepo", () => {
  const cleanup: Array<() => Promise<void>> = [];

  afterEach(async () => {
    while (cleanup.length > 0) {
      await cleanup.pop()?.();
    }
  });

  it("clones a git source into a temp directory and exposes cleanup", async () => {
    const sourceRepo = await mkdtemp(join(tmpdir(), "openci-git-source-"));
    execFileSync("git", ["init", "--initial-branch=main"], { cwd: sourceRepo, stdio: "ignore" });
    execFileSync("git", ["config", "user.name", "OpenCI Test"], {
      cwd: sourceRepo,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: sourceRepo,
      stdio: "ignore",
    });
    await writeFile(join(sourceRepo, "README.md"), "# source", "utf8");
    execFileSync("git", ["add", "."], { cwd: sourceRepo, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", "init"], { cwd: sourceRepo, stdio: "ignore" });

    const cloned = await cloneGitRepo({
      repoUrl: `file://${sourceRepo}`,
      sourceLabel: "file-source",
    });
    cleanup.push(cloned.cleanup);

    expect(cloned.path).toContain("openci-source-");
    expect(cloned.sourceLabel).toBe("file-source");
  });
});
