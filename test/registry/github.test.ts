import { execFileSync } from "node:child_process";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildGitCloneEnv, cloneGitRepo } from "../../src/registry/github.js";

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

  it("includes both attempted remotes when all clone URLs fail", async () => {
    await expect(
      cloneGitRepo({
        repoUrl: join(tempDir, "missing-https.git"),
        fallbackRepoUrls: [join(tempDir, "missing-ssh.git")],
        sourceLabel: "owner/private-repo",
      }),
    ).rejects.toThrow(/owner\/private-repo[\s\S]*missing-https\.git[\s\S]*missing-ssh\.git/);
  });

  it("uses non-interactive SSH clone options for SSH remotes", () => {
    const env = buildGitCloneEnv("git@github.com:owner/private-repo.git");
    expect(env.GIT_TERMINAL_PROMPT).toBe("0");
    expect(env.GIT_SSH_COMMAND).toContain("BatchMode=yes");
    expect(env.GIT_SSH_COMMAND).toContain("StrictHostKeyChecking=accept-new");
  });

  it("preserves an existing GIT_SSH_COMMAND while adding non-interactive flags", () => {
    const original = process.env.GIT_SSH_COMMAND;
    process.env.GIT_SSH_COMMAND =
      "ssh -i ~/.ssh/custom_key -p 2222 -o BatchMode=no -o StrictHostKeyChecking=no";

    try {
      const env = buildGitCloneEnv("git@github.com:owner/private-repo.git");
      expect(env.GIT_SSH_COMMAND).toContain("-i ~/.ssh/custom_key");
      expect(env.GIT_SSH_COMMAND).toContain("-p 2222");
      expect(env.GIT_SSH_COMMAND).toContain("BatchMode=yes");
      expect(env.GIT_SSH_COMMAND).toContain("StrictHostKeyChecking=accept-new");
      expect(env.GIT_SSH_COMMAND).not.toContain("BatchMode=no");
      expect(env.GIT_SSH_COMMAND).not.toContain("StrictHostKeyChecking=no");
    } finally {
      if (original === undefined) {
        delete process.env.GIT_SSH_COMMAND;
      } else {
        process.env.GIT_SSH_COMMAND = original;
      }
    }
  });
});
