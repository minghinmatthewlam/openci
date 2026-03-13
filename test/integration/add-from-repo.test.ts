import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helpers/cli.js";

describe("integration: add from local repo", () => {
  let tempDir: string;
  let targetRepo: string;
  let sourceRepo: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "openci-integ-"));

    // Create source repo with workflows
    sourceRepo = join(tempDir, "source");
    execFileSync("git", ["init", "--initial-branch=main", sourceRepo], {
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.email", "test@test.com"], {
      cwd: sourceRepo,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.name", "Test"], {
      cwd: sourceRepo,
      stdio: "ignore",
    });

    const workflowsDir = join(sourceRepo, ".github", "workflows");
    await mkdir(workflowsDir, { recursive: true });
    await writeFile(
      join(workflowsDir, "lint.yml"),
      `name: Lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint
`,
      "utf8",
    );
    await writeFile(
      join(workflowsDir, "deploy.yml"),
      `name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run deploy
        env:
          DEPLOY_KEY: \${{ secrets.DEPLOY_KEY }}
`,
      "utf8",
    );

    execFileSync("git", ["add", "."], { cwd: sourceRepo, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", "add workflows"], {
      cwd: sourceRepo,
      stdio: "ignore",
    });

    // Create target repo
    targetRepo = join(tempDir, "target");
    execFileSync("git", ["init", "--initial-branch=main", targetRepo], {
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.email", "test@test.com"], {
      cwd: targetRepo,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.name", "Test"], {
      cwd: targetRepo,
      stdio: "ignore",
    });
    await writeFile(join(targetRepo, "README.md"), "target", "utf8");
    execFileSync("git", ["add", "."], { cwd: targetRepo, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", "init"], {
      cwd: targetRepo,
      stdio: "ignore",
    });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("full add, list, status, update, remove cycle", async () => {
    // 1. List available workflows
    const listAvail = await runCli(["add", sourceRepo], { cwd: targetRepo });
    expect(listAvail.stdout).toContain("deploy");
    expect(listAvail.stdout).toContain("lint");
    expect(listAvail.stdout).toContain("2 workflow(s) found");

    // 2. Install lint workflow
    const addResult = await runCli(["add", sourceRepo, "--workflow", "lint", "--yes"], {
      cwd: targetRepo,
    });
    expect(addResult.error).toBeUndefined();
    const lintPath = join(targetRepo, ".github", "workflows", "lint.yml");
    const lintContent = await readFile(lintPath, "utf8");
    expect(lintContent).toContain("npm run lint");

    // 3. List installed workflows
    const listResult = await runCli(["list"], { cwd: targetRepo });
    expect(listResult.stdout).toContain("lint");
    expect(listResult.stdout).toContain("1 workflow(s) installed");

    // 4. Status check
    const statusResult = await runCli(["status"], { cwd: targetRepo });
    expect(statusResult.stdout).toContain("lint");
    expect(statusResult.stdout).toContain("installed");

    // 5. Update (should be up-to-date)
    const updateResult = await runCli(["update"], { cwd: targetRepo });
    expect(updateResult.error).toBeUndefined();
    expect(updateResult.stdout).toContain("up-to-date");

    // 6. Remove
    const removeResult = await runCli(["remove", "lint"], {
      cwd: targetRepo,
    });
    expect(removeResult.error).toBeUndefined();
    expect(removeResult.stdout).toContain("Removed lint");

    // 7. List should be empty
    const listAfter = await runCli(["list"], { cwd: targetRepo });
    expect(listAfter.stdout).toContain("0 workflows installed");
  });

  it("installs workflow and detects secrets needing setup", async () => {
    const result = await runCli(["add", sourceRepo, "--workflow", "deploy"], { cwd: targetRepo });
    expect(result.error).toBeUndefined();
    // Should mention DEPLOY_KEY in stderr (secret instructions)
    expect(result.stderr).toContain("DEPLOY_KEY");
  });

  it("update restores missing file", async () => {
    // Install
    await runCli(["add", sourceRepo, "--workflow", "lint", "--yes"], {
      cwd: targetRepo,
    });

    // Delete the workflow file
    const { unlink } = await import("node:fs/promises");
    await unlink(join(targetRepo, ".github", "workflows", "lint.yml"));

    // Update should restore it
    const updateResult = await runCli(["update"], { cwd: targetRepo });
    expect(updateResult.stdout).toContain("restored");

    // File should exist again
    const content = await readFile(join(targetRepo, ".github", "workflows", "lint.yml"), "utf8");
    expect(content).toContain("npm run lint");
  });
});
