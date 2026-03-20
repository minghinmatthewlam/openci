import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readInstallationMetadata, upsertInstallationMetadata } from "../../src/manifest/store.js";
import { computeHash } from "../../src/utils/workflow.js";
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

  function currentSourceCommit(): string {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: sourceRepo,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  }

  function commitAll(repo: string, message: string): string {
    execFileSync("git", ["add", "."], { cwd: repo, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", message], { cwd: repo, stdio: "ignore" });
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repo,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  }

  async function updateSourceWorkflow(content: string, message: string): Promise<string> {
    await writeFile(join(sourceRepo, ".github", "workflows", "ci.yml"), content, "utf8");
    return commitAll(sourceRepo, message);
  }

  async function installManagedWorkflow(params: {
    content: string;
    commit?: string;
    requiredSecrets?: string[];
  }): Promise<string> {
    const workflowPath = join(targetRepo, ".github", "workflows", "ci.yml");
    await mkdir(join(targetRepo, ".github", "workflows"), { recursive: true });
    await writeFile(workflowPath, params.content, "utf8");

    await upsertInstallationMetadata(targetRepo, {
      name: "ci",
      source: sourceRepo,
      workflow: "ci",
      contentHash: computeHash(params.content),
      targetPath: workflowPath,
      installedAt: "2026-01-01T00:00:00.000Z",
      ...(params.commit ? { commit: params.commit } : {}),
      ...(params.requiredSecrets ? { requiredSecrets: params.requiredSecrets } : {}),
    });

    return workflowPath;
  }

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

  it("updates a managed workflow when the source has changed", async () => {
    const initialContent = await readFile(
      join(sourceRepo, ".github", "workflows", "ci.yml"),
      "utf8",
    );
    const workflowPath = await installManagedWorkflow({
      content: initialContent,
      commit: currentSourceCommit(),
      requiredSecrets: ["API_TOKEN"],
    });

    const updatedContent =
      "on: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    timeout-minutes: 45\n    steps:\n      - run: echo updated\n        env:\n          TOKEN: ${{ secrets.NEW_API_TOKEN }}\n";
    const updatedCommit = await updateSourceWorkflow(updatedContent, "update workflow");

    const result = await runCli(["update"], { cwd: targetRepo });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("ci\tupdated");
    expect(await readFile(workflowPath, "utf8")).toContain("echo updated");

    const metadata = await readInstallationMetadata(targetRepo, "ci");
    expect(metadata?.commit).toBe(updatedCommit);
    expect(metadata?.contentHash).toBe(computeHash(updatedContent));
    expect(metadata?.requiredSecrets).toEqual(["NEW_API_TOKEN"]);
  });

  it("restores a missing managed workflow file", async () => {
    const initialContent = await readFile(
      join(sourceRepo, ".github", "workflows", "ci.yml"),
      "utf8",
    );
    const workflowPath = await installManagedWorkflow({
      content: initialContent,
      commit: currentSourceCommit(),
      requiredSecrets: ["API_TOKEN"],
    });

    await rm(workflowPath, { force: true });

    const result = await runCli(["update"], { cwd: targetRepo });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("ci\trestored");
    expect(await readFile(workflowPath, "utf8")).toContain("API_TOKEN");
  });

  it("skips locally modified workflows unless forced", async () => {
    const initialContent = await readFile(
      join(sourceRepo, ".github", "workflows", "ci.yml"),
      "utf8",
    );
    const workflowPath = await installManagedWorkflow({
      content: initialContent,
      commit: currentSourceCommit(),
      requiredSecrets: ["API_TOKEN"],
    });

    await writeFile(
      workflowPath,
      "on: push\njobs:\n  local:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo local edits\n",
      "utf8",
    );
    await updateSourceWorkflow(
      "on: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    timeout-minutes: 60\n    steps:\n      - run: echo upstream change\n        env:\n          TOKEN: ${{ secrets.UPSTREAM_SECRET }}\n",
      "upstream change",
    );

    const result = await runCli(["update"], { cwd: targetRepo });
    expect(result.error).toBeUndefined();
    expect(result.stderr).toContain("locally modified");
    expect(await readFile(workflowPath, "utf8")).toContain("local edits");
  });

  it("overwrites locally modified workflows with --force", async () => {
    const initialContent = await readFile(
      join(sourceRepo, ".github", "workflows", "ci.yml"),
      "utf8",
    );
    const workflowPath = await installManagedWorkflow({
      content: initialContent,
      commit: currentSourceCommit(),
      requiredSecrets: ["API_TOKEN"],
    });

    await writeFile(
      workflowPath,
      "on: push\njobs:\n  local:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo local edits\n",
      "utf8",
    );
    const updatedContent =
      "on: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    timeout-minutes: 60\n    steps:\n      - run: echo upstream force\n        env:\n          TOKEN: ${{ secrets.UPSTREAM_SECRET }}\n";
    const updatedCommit = await updateSourceWorkflow(updatedContent, "force change");

    const result = await runCli(["update", "--force"], { cwd: targetRepo });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("ci\tupdated");
    expect(await readFile(workflowPath, "utf8")).toContain("upstream force");

    const metadata = await readInstallationMetadata(targetRepo, "ci");
    expect(metadata?.commit).toBe(updatedCommit);
    expect(metadata?.requiredSecrets).toEqual(["UPSTREAM_SECRET"]);
  });
});
