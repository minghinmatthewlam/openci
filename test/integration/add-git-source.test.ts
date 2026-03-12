import { cpSync, existsSync, readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { detectionFixture, normalizePath, runCli } from "./helpers.js";

function makeSourceRepo(): string {
  const repo = mkdtempSync(join(tmpdir(), "openci-source-registry-"));
  cpSync("/Users/matthewlam/dev/openci/test/fixtures/registry/.", repo, { recursive: true });
  execFileSync("git", ["init", "--initial-branch=main"], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "OpenCI Test"], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["add", "."], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "init"], { cwd: repo, stdio: "ignore" });
  return repo;
}

describe("integration: add git source", () => {
  it("installs from a cloneable git source with source-first semantics", () => {
    const targetRepo = mkdtempSync(join(tmpdir(), "openci-target-repo-"));
    execFileSync("git", ["init", "--initial-branch=main"], { cwd: targetRepo, stdio: "ignore" });
    execFileSync("git", ["config", "user.name", "OpenCI Test"], {
      cwd: targetRepo,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: targetRepo,
      stdio: "ignore",
    });
    execFileSync("git", ["commit", "--allow-empty", "-m", "init"], {
      cwd: targetRepo,
      stdio: "ignore",
    });
    execFileSync("git", ["remote", "add", "origin", "https://github.com/acme/project.git"], {
      cwd: targetRepo,
      stdio: "ignore",
    });
    cpSync(detectionFixture("pnpm-next"), targetRepo, { recursive: true });

    const sourceRepo = makeSourceRepo();
    const result = runCli(["add", `file://${sourceRepo}`, "--workflow", "pr-review", "--yes"], {
      cwd: targetRepo,
    });

    const targetPath = join(targetRepo, ".github", "workflows", "pr-review.yml");

    expect(result.status).toBe(0);
    expect(normalizePath(result.stdout.trim())).toBe(normalizePath(targetPath));
    expect(existsSync(targetPath)).toBe(true);
    expect(readFileSync(targetPath, "utf8")).toContain("pnpm install --frozen-lockfile");
  });
});
