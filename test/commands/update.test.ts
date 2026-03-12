import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { CliError } from "../../src/core/errors.js";
import { runCli } from "../helpers/cli.js";
import { detectionFixturePath, registryFixturesRoot } from "../helpers/paths.js";

function git(cwd: string, args: string[]): void {
  execFileSync("git", args, { cwd, stdio: "ignore" });
}

describe("update command", () => {
  it("updates an installed workflow from its stored source metadata", async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), "openci-update-source-"));
    await cp(registryFixturesRoot, sourceRoot, {
      recursive: true,
    });
    const sourceRegistryRoot = sourceRoot;

    const repo = await mkdtemp(join(tmpdir(), "openci-update-target-"));
    await cp(detectionFixturePath("pnpm-next"), repo, {
      recursive: true,
    });
    git(repo, ["init", "--initial-branch=main"]);
    git(repo, ["config", "user.name", "OpenCI Test"]);
    git(repo, ["config", "user.email", "test@example.com"]);
    git(repo, ["add", "."]);
    git(repo, ["commit", "-m", "init"]);

    const installResult = await runCli(
      ["add", sourceRegistryRoot, "--workflow", "pr-review", "--yes"],
      { cwd: repo },
    );
    expect(installResult.error).toBeUndefined();

    await writeFile(
      join(sourceRegistryRoot, "workflows", "pr-review", "workflow.yml.tmpl"),
      "name: AI PR Review\njobs:\n  review:\n    steps:\n      - run: echo updated-template\n",
      "utf8",
    );

    const updateResult = await runCli(["update", "pr-review"], { cwd: repo });
    const workflowPath = join(repo, ".github", "workflows", "pr-review.yml");
    const written = await readFile(workflowPath, "utf8");

    expect(updateResult.error).toBeUndefined();
    expect(updateResult.stdout).toContain("pr-review\tupdated");
    expect(written).toContain("updated-template");
  });

  it("updates a script-runtime workflow and preserves runtime metadata", async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), "openci-update-script-source-"));
    await cp(registryFixturesRoot, sourceRoot, {
      recursive: true,
    });

    const repo = await mkdtemp(join(tmpdir(), "openci-update-script-target-"));
    await cp(detectionFixturePath("pnpm-next"), repo, {
      recursive: true,
    });
    git(repo, ["init", "--initial-branch=main"]);
    git(repo, ["config", "user.name", "OpenCI Test"]);
    git(repo, ["config", "user.email", "test@example.com"]);
    git(repo, ["add", "."]);
    git(repo, ["commit", "-m", "init"]);

    const installResult = await runCli(
      [
        "add",
        sourceRoot,
        "--workflow",
        "security-scan",
        "--provider",
        "glm",
        "--runtime",
        "script",
        "--runner",
        "self-hosted-a8",
        "--yes",
      ],
      { cwd: repo },
    );
    expect(installResult.error).toBeUndefined();

    await writeFile(
      join(sourceRoot, "workflows", "security-scan", "workflow.yml.tmpl"),
      "name: Security Scan\njobs:\n  scan:\n    runs-on: {{RUNS_ON}}\n    steps:\n      {{PROVIDER_STEP}}\n      - run: echo updated-script-template\n",
      "utf8",
    );

    const updateResult = await runCli(["update", "security-scan"], { cwd: repo });
    const workflowPath = join(repo, ".github", "workflows", "security-scan.yml");
    const sidecarPath = join(repo, ".github", "workflows", ".openci", "security-scan.json");
    const written = await readFile(workflowPath, "utf8");
    const sidecar = JSON.parse(await readFile(sidecarPath, "utf8")) as {
      runtime?: string;
      runner?: string;
    };

    expect(updateResult.error).toBeUndefined();
    expect(updateResult.stdout).toContain("security-scan\tupdated");
    expect(written).toContain("updated-script-template");
    expect(written).toContain("runs-on: [self-hosted, linux, x64, a8]");
    expect(sidecar.runtime).toBe("script");
    expect(sidecar.runner).toBe("self-hosted-a8");
  });

  it("errors when a requested workflow name is not installed", async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), "openci-update-missing-name-source-"));
    await cp(registryFixturesRoot, sourceRoot, {
      recursive: true,
    });

    const repo = await mkdtemp(join(tmpdir(), "openci-update-missing-name-"));
    git(repo, ["init", "--initial-branch=main"]);
    git(repo, ["config", "user.name", "OpenCI Test"]);
    git(repo, ["config", "user.email", "test@example.com"]);
    git(repo, ["commit", "--allow-empty", "-m", "init"]);

    const installResult = await runCli(["add", sourceRoot, "--workflow", "pr-review", "--yes"], {
      cwd: repo,
    });
    expect(installResult.error).toBeUndefined();

    const result = await runCli(["update", "missing-workflow"], { cwd: repo });

    expect(result.error).toBeInstanceOf(CliError);
    expect((result.error as CliError).message).toBe(
      "No installed workflows matched: missing-workflow",
    );
  });

  it("reports partial update failures after updating successful workflows", async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), "openci-update-partial-source-"));
    await cp(registryFixturesRoot, sourceRoot, {
      recursive: true,
    });

    const repo = await mkdtemp(join(tmpdir(), "openci-update-partial-target-"));
    await cp(detectionFixturePath("pnpm-next"), repo, {
      recursive: true,
    });
    git(repo, ["init", "--initial-branch=main"]);
    git(repo, ["config", "user.name", "OpenCI Test"]);
    git(repo, ["config", "user.email", "test@example.com"]);
    git(repo, ["add", "."]);
    git(repo, ["commit", "-m", "init"]);

    const installPrReview = await runCli(["add", sourceRoot, "--workflow", "pr-review", "--yes"], {
      cwd: repo,
    });
    const installSecurityScan = await runCli(
      [
        "add",
        sourceRoot,
        "--workflow",
        "security-scan",
        "--provider",
        "glm",
        "--runtime",
        "script",
        "--runner",
        "self-hosted-a8",
        "--yes",
      ],
      { cwd: repo },
    );

    expect(installPrReview.error).toBeUndefined();
    expect(installSecurityScan.error).toBeUndefined();

    await writeFile(
      join(sourceRoot, "workflows", "security-scan", "openci.config.json"),
      "{ not-valid-json }",
      "utf8",
    );

    const result = await runCli(["update"], { cwd: repo });

    expect(result.error).toBeInstanceOf(CliError);
    expect(result.stdout).toContain("pr-review\tupdated");
    expect(result.stderr).toContain("security-scan\tfailed\tInvalid OpenCI config");
    expect((result.error as CliError).message).toBe(
      "Failed to update 1 workflow(s): security-scan",
    );
  });
});
