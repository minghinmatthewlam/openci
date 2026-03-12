import { cp, mkdtemp, readFile, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../helpers/cli.js";
import * as secretsCheck from "../../src/secrets/check.js";

const registryUrl = "file:///Users/matthewlam/dev/openci/test/fixtures/registry";
const fixtureRoot = "/Users/matthewlam/dev/openci/test/fixtures/detection/pnpm-next";

function git(cwd: string, args: string[]): void {
  execFileSync("git", args, { cwd, stdio: "ignore" });
}

describe("add smart workflow", () => {
  let repo: string;
  const sourceRoot = "/Users/matthewlam/dev/openci/test/fixtures/registry";

  beforeEach(async () => {
    repo = await mkdtemp(join(tmpdir(), "openci-add-smart-"));
    process.env.OPENCI_REGISTRY_URL = registryUrl;
    await cp(fixtureRoot, repo, { recursive: true });
    git(repo, ["init", "--initial-branch=main"]);
    git(repo, ["config", "user.name", "OpenCI Test"]);
    git(repo, ["config", "user.email", "test@example.com"]);
    git(repo, ["add", "."]);
    git(repo, ["commit", "-m", "init"]);
    git(repo, ["remote", "add", "origin", "https://github.com/acme/project.git"]);
    vi.spyOn(secretsCheck, "isGhAvailable").mockReturnValue(false);
    vi.spyOn(secretsCheck, "isGhAuthenticated").mockReturnValue(false);
  });

  afterEach(() => {
    delete process.env.OPENCI_REGISTRY_URL;
    vi.restoreAllMocks();
  });

  it("renders and writes a smart workflow", async () => {
    const result = await runCli(["add", sourceRoot, "--workflow", "pr-review", "--yes"], {
      cwd: repo,
    });
    const workflowPath = join(repo, ".github", "workflows", "pr-review.yml");
    const written = await readFile(workflowPath, "utf8");

    expect(result.error).toBeUndefined();
    expect(await realpath(result.stdout.trim())).toBe(await realpath(workflowPath));
    expect(result.stderr).toContain("Required secret: ANTHROPIC_API_KEY");
    expect(written).toContain("pnpm install --frozen-lockfile");
    expect(written).toContain("model: claude-sonnet-4-6");
    expect(written).toContain("Review a Next.js project using pnpm.");
  });

  it("infers the provider from --model when --provider is omitted", async () => {
    const result = await runCli(
      ["add", sourceRoot, "--workflow", "pr-review", "--model", "codex-mini", "--yes"],
      {
        cwd: repo,
      },
    );
    const workflowPath = join(repo, ".github", "workflows", "pr-review.yml");
    const written = await readFile(workflowPath, "utf8");

    expect(result.error).toBeUndefined();
    expect(written).toContain("openai/codex-action@v1");
    expect(written).toContain("model: codex-mini");
  });
});
