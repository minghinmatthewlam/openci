import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { runCli } from "../helpers/cli.js";
import { detectionFixturePath, workspaceRoot } from "../helpers/paths.js";

function git(cwd: string, args: string[]): void {
  execFileSync("git", args, { cwd, stdio: "ignore" });
}

describe("add repo source", () => {
  it("installs from the repo root workflow source layout", async () => {
    const repo = await mkdtemp(join(tmpdir(), "openci-add-repo-source-"));
    const fixtureRoot = detectionFixturePath("pnpm-next");
    execFileSync("cp", ["-R", `${fixtureRoot}/.`, repo]);
    git(repo, ["init", "--initial-branch=main"]);
    git(repo, ["config", "user.name", "OpenCI Test"]);
    git(repo, ["config", "user.email", "test@example.com"]);
    git(repo, ["add", "."]);
    git(repo, ["commit", "-m", "init"]);

    const result = await runCli(["add", workspaceRoot, "--workflow", "pr-review", "--yes"], {
      cwd: repo,
    });
    const workflowPath = join(repo, ".github", "workflows", "pr-review.yml");
    const written = await readFile(workflowPath, "utf8");

    expect(result.error).toBeUndefined();
    expect(written).toContain("anthropics/claude-code-action@v1");
    expect(written).toContain("runs-on: ubuntu-latest");
  });
});
