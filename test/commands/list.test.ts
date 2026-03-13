import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { upsertInstallationMetadata } from "../../src/manifest/store.js";
import { runCli } from "../helpers/cli.js";

describe("list command", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "openci-list-test-"));
    execFileSync("git", ["init", "--initial-branch=main", tempDir], {
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.email", "test@test.com"], {
      cwd: tempDir,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.name", "Test"], {
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

  it("shows empty message when no workflows installed", async () => {
    const result = await runCli(["list"], { cwd: tempDir });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("0 workflows installed");
  });

  it("lists installed workflows", async () => {
    await upsertInstallationMetadata(tempDir, {
      name: "ci",
      source: "owner/repo",
      workflow: "ci",
      targetPath: join(tempDir, ".github", "workflows", "ci.yml"),
      installedAt: "2026-01-15T00:00:00.000Z",
    });

    const result = await runCli(["list"], { cwd: tempDir });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("ci");
    expect(result.stdout).toContain("owner/repo");
    expect(result.stdout).toContain("2026-01-15");
    expect(result.stdout).toContain("1 workflow(s) installed");
  });
});
