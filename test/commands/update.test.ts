import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { upsertInstallationMetadata } from "../../src/manifest/store.js";
import { runCli } from "../helpers/cli.js";

describe("update command", () => {
  let tempDir: string;
  let targetRepo: string;
  let sourceRepo: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "openci-update-test-"));

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
    execFileSync("git", ["config", "commit.gpgsign", "false"], {
      cwd: sourceRepo,
      stdio: "ignore",
    });
    await mkdir(join(sourceRepo, ".github", "workflows"), { recursive: true });
    await writeFile(
      join(sourceRepo, ".github", "workflows", "ci.yml"),
      "on: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    timeout-minutes: 30\n    steps:\n      - run: echo hi\n        env:\n          TOKEN: ${{ secrets.API_TOKEN }}\n",
      "utf8",
    );
    execFileSync("git", ["add", "."], { cwd: sourceRepo, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", "init"], { cwd: sourceRepo, stdio: "ignore" });

    targetRepo = join(tempDir, "target");
    execFileSync("git", ["init", "--initial-branch=main", targetRepo], { stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "test@test.com"], {
      cwd: targetRepo,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.name", "Test"], {
      cwd: targetRepo,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "commit.gpgsign", "false"], {
      cwd: targetRepo,
      stdio: "ignore",
    });
    await writeFile(join(targetRepo, "README.md"), "target", "utf8");
    execFileSync("git", ["add", "."], { cwd: targetRepo, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", "init"], { cwd: targetRepo, stdio: "ignore" });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("backfills requiredSecrets metadata for up-to-date installs", async () => {
    const workflowPath = join(targetRepo, ".github", "workflows", "ci.yml");
    await mkdir(join(targetRepo, ".github", "workflows"), { recursive: true });
    const content = await readFile(join(sourceRepo, ".github", "workflows", "ci.yml"), "utf8");
    await writeFile(workflowPath, content, "utf8");

    await upsertInstallationMetadata(targetRepo, {
      name: "ci",
      source: sourceRepo,
      workflow: "ci",
      targetPath: workflowPath,
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await runCli(["update"], { cwd: targetRepo });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("ci\tup-to-date");

    const metadata = JSON.parse(
      await readFile(join(targetRepo, ".github", "workflows", ".openci", "ci.json"), "utf8"),
    );
    expect(metadata.requiredSecrets).toEqual(["API_TOKEN"]);
  });

  it("skips overwrite when baseline hash is missing and local content differs", async () => {
    const workflowPath = join(targetRepo, ".github", "workflows", "ci.yml");
    await mkdir(join(targetRepo, ".github", "workflows"), { recursive: true });
    await writeFile(
      workflowPath,
      "on: push\njobs:\n  local:\n    runs-on: ubuntu-latest\n",
      "utf8",
    );

    await upsertInstallationMetadata(targetRepo, {
      name: "ci",
      source: sourceRepo,
      workflow: "ci",
      targetPath: workflowPath,
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await runCli(["update"], { cwd: targetRepo });
    expect(result.error).toBeUndefined();
    expect(result.stderr).toContain("missing baseline hash");

    const content = await readFile(workflowPath, "utf8");
    expect(content).toContain("local:");
  });
});
