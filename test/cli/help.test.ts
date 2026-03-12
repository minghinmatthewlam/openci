import { describe, expect, it } from "vitest";
import { buildCli } from "../../src/cli.js";

function collectHelp(args: string[]): { stdout: string; stderr: string } {
  let stdout = "";
  let stderr = "";

  const program = buildCli("0.1.0")
    .exitOverride()
    .configureOutput({
      writeOut: (text) => {
        stdout += text;
      },
      writeErr: (text) => {
        stderr += text;
      },
    });

  try {
    program.parse(args, { from: "user" });
  } catch {
    // Commander throws after writing help when exitOverride is enabled.
  }

  return { stdout, stderr };
}

describe("CLI help", () => {
  it("renders top-level help with the full command surface", () => {
    const { stdout } = collectHelp(["node", "openci", "--help"]);

    expect(stdout).toContain("Discover and install AI-powered GitHub Actions workflows");
    expect(stdout).toContain("add");
    expect(stdout).toContain("search");
    expect(stdout).toContain("list");
    expect(stdout).toContain("info");
    expect(stdout).toContain("status");
    expect(stdout).toContain("init");
    expect(stdout).toContain("create");
  });

  it.each(["add", "search", "list", "info", "status", "init", "create"])(
    "renders help for %s",
    (commandName) => {
      const { stdout } = collectHelp(["node", "openci", commandName, "--help"]);
      expect(stdout).toContain(commandName);
    },
  );
});
