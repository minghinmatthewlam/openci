import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { upsertInstallationMetadata } from "../../src/manifest/store.js";
import { runCli } from "../helpers/cli.js";

describe("status command", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "openci-status-test-"));
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

  it("shows header even with no workflows", async () => {
    const result = await runCli(["status"], { cwd: tempDir });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("name\tsource\tfile\tstatus");
  });

  it("shows installed status when file exists", async () => {
    const workflowsDir = join(tempDir, ".github", "workflows");
    await mkdir(workflowsDir, { recursive: true });
    await writeFile(join(workflowsDir, "ci.yml"), "on: push", "utf8");

    await upsertInstallationMetadata(tempDir, {
      name: "ci",
      source: "owner/repo",
      workflow: "ci",
      targetPath: join(tempDir, ".github", "workflows", "ci.yml"),
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await runCli(["status"], { cwd: tempDir });
    expect(result.stdout).toContain("ci\towner/repo");
    expect(result.stdout).toContain("installed");
  });

  it("shows missing-file status when workflow file is gone", async () => {
    await upsertInstallationMetadata(tempDir, {
      name: "ci",
      source: "owner/repo",
      workflow: "ci",
      targetPath: join(tempDir, ".github", "workflows", "ci.yml"),
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await runCli(["status"], { cwd: tempDir });
    expect(result.stdout).toContain("missing-file");
  });

  it("shows untracked workflows that have no metadata", async () => {
    const workflowsDir = join(tempDir, ".github", "workflows");
    await mkdir(workflowsDir, { recursive: true });
    await writeFile(join(workflowsDir, "manual.yml"), "on: push", "utf8");

    const result = await runCli(["status"], { cwd: tempDir });
    expect(result.stdout).toContain("manual");
    expect(result.stdout).toContain("untracked");
  });
});
