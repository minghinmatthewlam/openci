import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { upsertInstallationMetadata } from "../../src/manifest/store.js";
import { runCli } from "../helpers/cli.js";

describe("doctor command", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "openci-doctor-test-"));
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
    const result = await runCli(["doctor"], { cwd: tempDir });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("0 workflows installed");
  });

  it("reports file-exists check", async () => {
    const workflowsDir = join(tempDir, ".github", "workflows");
    await mkdir(workflowsDir, { recursive: true });
    await writeFile(
      join(workflowsDir, "ci.yml"),
      "on: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    timeout-minutes: 30\n",
      "utf8",
    );

    await upsertInstallationMetadata(tempDir, {
      name: "ci",
      source: "owner/repo",
      workflow: "ci",
      targetPath: join(tempDir, ".github", "workflows", "ci.yml"),
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await runCli(["doctor"], { cwd: tempDir });
    expect(result.stdout).toContain("File exists");
    expect(result.stdout).toContain("timeout-minutes is set");
  });

  it("reports missing file", async () => {
    await upsertInstallationMetadata(tempDir, {
      name: "missing",
      source: "owner/repo",
      workflow: "missing",
      targetPath: join(tempDir, ".github", "workflows", "missing.yml"),
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await runCli(["doctor"], { cwd: tempDir });
    expect(result.stdout).toContain("File missing");
  });

  it("warns about missing timeout", async () => {
    const workflowsDir = join(tempDir, ".github", "workflows");
    await mkdir(workflowsDir, { recursive: true });
    await writeFile(
      join(workflowsDir, "ci.yml"),
      "on: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n",
      "utf8",
    );

    await upsertInstallationMetadata(tempDir, {
      name: "ci",
      source: "owner/repo",
      workflow: "ci",
      targetPath: join(tempDir, ".github", "workflows", "ci.yml"),
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await runCli(["doctor"], { cwd: tempDir });
    expect(result.stdout).toContain("No timeout-minutes");
  });
});
