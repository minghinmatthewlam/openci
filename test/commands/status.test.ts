import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { runCli } from "../helpers/cli.js";
import { upsertInstallationMetadata } from "../../src/manifest/store.js";

function git(cwd: string, args: string[]): void {
  execFileSync("git", args, { cwd, stdio: "ignore" });
}

describe("status command", () => {
  it("shows tracked and untracked workflows", async () => {
    const repo = await mkdtemp(join(tmpdir(), "openci-status-"));
    await mkdir(join(repo, ".github", "workflows"), { recursive: true });
    await writeFile(
      join(repo, ".github", "workflows", "pr-review.yml"),
      "name: AI PR Review",
      "utf8",
    );
    await writeFile(join(repo, ".github", "workflows", "extra.yml"), "name: Extra", "utf8");
    await upsertInstallationMetadata(repo, {
      name: "pr-review",
      source: "official",
      provider: "claude",
      runtime: "action",
      runner: "github-ubuntu",
      smart: true,
      workflowVersion: "1.0.0",
      targetPath: join(repo, ".github", "workflows", "pr-review.yml"),
      installedAt: "2026-03-09T12:34:56Z",
    });
    git(repo, ["init", "--initial-branch=main"]);
    git(repo, ["config", "user.name", "OpenCI Test"]);
    git(repo, ["config", "user.email", "test@example.com"]);
    git(repo, ["commit", "--allow-empty", "-m", "init"]);

    const result = await runCli(["status"], { cwd: repo });

    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain(
      "pr-review\tclaude\taction\tgithub-ubuntu\tofficial\t1.0.0\t.github/workflows/pr-review.yml\tinstalled",
    );
    expect(result.stdout).toContain(
      "extra\tunknown\tunknown\tunknown\tunknown\tunknown\t.github/workflows/extra.yml\tuntracked-file",
    );
  });

  it("falls back to untracked rows when manifest is absent", async () => {
    const repo = await mkdtemp(join(tmpdir(), "openci-status-untracked-"));
    await mkdir(join(repo, ".github", "workflows"), { recursive: true });
    await writeFile(
      join(repo, ".github", "workflows", "pr-review.yml"),
      "name: AI PR Review",
      "utf8",
    );
    git(repo, ["init", "--initial-branch=main"]);
    git(repo, ["config", "user.name", "OpenCI Test"]);
    git(repo, ["config", "user.email", "test@example.com"]);
    git(repo, ["commit", "--allow-empty", "-m", "init"]);

    const result = await runCli(["status"], { cwd: repo });

    expect(result.stdout).toContain(
      "pr-review\tunknown\tunknown\tunknown\tunknown\tunknown\t.github/workflows/pr-review.yml\tuntracked-file",
    );
  });
});
