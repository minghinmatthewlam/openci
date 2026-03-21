import { describe, expect, it } from "vitest";
import pkg from "../../package.json" with { type: "json" };
import { runCli } from "../helpers/cli.js";

describe("CLI help", () => {
  it("shows help with --help", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).toContain("openci");
    expect(result.stdout).toContain("Install GitHub Actions workflows from any repo");
  });

  it("shows version with --version", async () => {
    const result = await runCli(["--version"]);
    expect(result.stdout).toContain(pkg.version);
  });

  it("registers add command", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).toContain("add");
  });

  it("documents GitHub fallback and private SSH guidance in add help", async () => {
    const result = await runCli(["add", "--help"]);
    expect(result.stdout).toContain("owner/repo");
    expect(result.stdout).toContain("github:owner/repo");
    expect(result.stdout).toContain("git@github.com:owner/repo.git");
    expect(result.stdout).toContain("HTTPS/SSH clone fallback");
    expect(result.stdout).toContain("explicit SSH is the most predictable choice");
  });

  it("registers search command", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).toContain("search");
  });

  it("registers list command", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).toContain("list");
  });

  it("registers status command", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).toContain("status");
  });

  it("registers update command", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).toContain("update");
  });

  it("registers remove command", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).toContain("remove");
  });

  it("registers doctor command", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).toContain("doctor");
  });

  it("does not register old commands (info, create)", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).not.toContain("info");
    expect(result.stdout).not.toContain("create");
  });
});
