import { execFileSync } from "node:child_process";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { upsertInstallationMetadata } from "../../src/manifest/store.js";
import { runCli } from "../helpers/cli.js";

describe("remove command", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "openci-remove-test-"));
    execFileSync("git", ["init", "--initial-branch=main", tempDir], {
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.email", "test@test.com"], {
      cwd: tempDir,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.name", "Test"], {});
    execFileSync("git", ["config", "commit.gpgsign", "false"], {
      cwd: tempDir,
      stdio: "ignore",
      cwd: tempDir,
      stdio: "ignore",
    });
    await writeFile(join(tempDir, "README.md"), "test", "utf8");
    execFileSync("git", ["add", "."], { cwd: tempDir, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", "init"], {
      cwd: tempDir,
      stdio: "ignore",
    });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("removes installed workflow and metadata", async () => {
    const workflowsDir = join(tempDir, ".github", "workflows");
    await mkdir(workflowsDir, { recursive: true });
    const workflowPath = join(workflowsDir, "ci.yml");
    await writeFile(workflowPath, "on: push\n", "utf8");

    await upsertInstallationMetadata(tempDir, {
      name: "ci",
      source: "owner/repo",
      workflow: "ci",
      targetPath: workflowPath,
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await runCli(["remove", "ci"], { cwd: tempDir });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("Removed ci");

    // Workflow file should be gone
    await expect(access(workflowPath)).rejects.toThrow();

    // Metadata should be gone
    const metadataPath = join(workflowsDir, ".openci", "ci.json");
    await expect(access(metadataPath)).rejects.toThrow();
  });

  it("errors when workflow is not installed", async () => {
    const result = await runCli(["remove", "nonexistent"], { cwd: tempDir });
    expect(result.error).toBeDefined();
    expect((result.error as Error).message).toContain("not installed");
  });

  it("reports orphaned secrets after removal", async () => {
    const workflowsDir = join(tempDir, ".github", "workflows");
    await mkdir(workflowsDir, { recursive: true });

    const content = `
on: push
steps:
  - uses: some-action@v1
    with:
      key: \${{ secrets.MY_SECRET }}
`;
    await writeFile(join(workflowsDir, "ci.yml"), content, "utf8");

    await upsertInstallationMetadata(tempDir, {
      name: "ci",
      source: "owner/repo",
      workflow: "ci",
      targetPath: join(workflowsDir, "ci.yml"),
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await runCli(["remove", "ci"], { cwd: tempDir });
    expect(result.stdout).toContain("MY_SECRET");
    expect(result.stdout).toContain("may no longer be needed");
  });
});
