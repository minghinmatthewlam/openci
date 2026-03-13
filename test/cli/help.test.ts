import { describe, expect, it } from "vitest";
import { runCli } from "../helpers/cli.js";

describe("CLI help", () => {
  it("shows help with --help", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).toContain("openci");
    expect(result.stdout).toContain("Install GitHub Actions workflows from any repo");
  });

  it("shows version with --version", async () => {
    const result = await runCli(["--version"]);
    expect(result.stdout).toContain("0.1.0");
  });

  it("registers add command", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).toContain("add");
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

  it("does not register old commands (search, info, create)", async () => {
    const result = await runCli(["--help"]);
    expect(result.stdout).not.toContain("search");
    expect(result.stdout).not.toContain("info");
    expect(result.stdout).not.toContain("create");
  });
});
