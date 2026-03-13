import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helpers/cli.js";
import { sourceRepoFixture } from "../helpers/paths.js";

describe("add command", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "openci-add-test-"));
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
    // Create an initial commit so git rev-parse works
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

  it("lists available workflows when --workflow is omitted", async () => {
    const result = await runCli(["add", sourceRepoFixture], { cwd: tempDir });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("pr-review");
    expect(result.stdout).toContain("issue-triage");
    expect(result.stdout).toContain("ci");
    expect(result.stdout).toContain("3 workflow(s) found");
  });

  it("installs a workflow file", async () => {
    const result = await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--yes"], {
      cwd: tempDir,
    });
    expect(result.error).toBeUndefined();

    const targetPath = join(tempDir, ".github", "workflows", "pr-review.yml");
    const content = await readFile(targetPath, "utf8");
    expect(content).toContain("anthropics/claude-code-action");
  });

  it("creates sidecar metadata", async () => {
    await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--yes"], {
      cwd: tempDir,
    });

    const metadataPath = join(tempDir, ".github", "workflows", ".openci", "pr-review.json");
    const raw = await readFile(metadataPath, "utf8");
    const data = JSON.parse(raw);
    expect(data.name).toBe("pr-review");
    expect(data.source).toBe(sourceRepoFixture);
    expect(data.contentHash).toBeTruthy();
  });

  it("refuses to overwrite without --force", async () => {
    await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--yes"], {
      cwd: tempDir,
    });
    const result = await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--yes"], {
      cwd: tempDir,
    });
    expect(result.error).toBeDefined();
    expect((result.error as Error).message).toContain("already exists");
  });

  it("overwrites with --force", async () => {
    await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--yes"], {
      cwd: tempDir,
    });
    const result = await runCli(
      ["add", sourceRepoFixture, "--workflow", "pr-review", "--yes", "--force"],
      { cwd: tempDir },
    );
    expect(result.error).toBeUndefined();
  });

  it("dry-run does not write files", async () => {
    const result = await runCli(
      ["add", sourceRepoFixture, "--workflow", "pr-review", "--dry-run"],
      { cwd: tempDir },
    );
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("Would install");

    const targetPath = join(tempDir, ".github", "workflows", "pr-review.yml");
    await expect(access(targetPath)).rejects.toThrow();
  });

  it("shows post-install intelligence in interactive mode", async () => {
    const result = await runCli(["add", sourceRepoFixture, "--workflow", "pr-review"], {
      cwd: tempDir,
    });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("Provider:");
    expect(result.stdout).toContain("Claude");
    expect(result.stdout).toContain("Triggers:");
  });

  it("installs .yaml extension workflows", async () => {
    const result = await runCli(["add", sourceRepoFixture, "--workflow", "ci", "--yes"], {
      cwd: tempDir,
    });
    expect(result.error).toBeUndefined();

    const targetPath = join(tempDir, ".github", "workflows", "ci.yaml");
    const content = await readFile(targetPath, "utf8");
    expect(content).toContain("npm test");
  });
});
