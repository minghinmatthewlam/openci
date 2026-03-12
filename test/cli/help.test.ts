import { describe, expect, it, vi } from "vitest";
import { buildCli } from "../../src/cli.js";

function collectHelp(args: string[]): { stdout: string; stderr: string } {
  let stdout = "";
  let stderr = "";

  const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(((
    chunk: string | Uint8Array,
  ) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write);
  const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(((
    chunk: string | Uint8Array,
  ) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write);

  try {
    buildCli("0.1.0").exitOverride().parse(args, { from: "node" });
  } catch {
    // Commander throws after writing help when exitOverride is enabled.
  } finally {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  }

  return { stdout, stderr };
}

function collectHelpText(args: string[]): string {
  const { stdout, stderr } = collectHelp(args);
  return stdout + stderr;
}

describe("CLI help", () => {
  it("renders top-level help with the full command surface", () => {
    const output = collectHelpText(["node", "openci", "--help"]);

    expect(output).toContain("Discover and install AI-powered GitHub Actions workflows");
    expect(output).toContain("add");
    expect(output).toContain("search");
    expect(output).toContain("list");
    expect(output).toContain("info");
    expect(output).toContain("status");
    expect(output).toContain("init");
    expect(output).toContain("create");
    expect(output).not.toContain("--provider");
  });

  it.each(["add", "search", "list", "info", "status", "init", "create"])(
    "renders help for %s",
    (commandName) => {
      const output = collectHelpText(["node", "openci", commandName, "--help"]);
      expect(output).toContain(commandName);
    },
  );

  it("shows workflow install flags on add help only", () => {
    const output = collectHelpText(["node", "openci", "add", "--help"]);

    expect(output).toContain("--provider");
    expect(output).toContain("--runtime");
    expect(output).toContain("--runner");
    expect(output).toContain("--model");
    expect(output).toContain("--trigger");
    expect(output).toContain("--branch");
    expect(output).toContain("--dry-run");
    expect(output).toContain("--yes");
    expect(output).toContain("--verbose");
  });

  it("shows create-only flags on create help", () => {
    const output = collectHelpText(["node", "openci", "create", "--help"]);

    expect(output).toContain("--smart");
    expect(output).toContain("--yes");
    expect(output).toContain("--verbose");
    expect(output).not.toContain("--provider");
    expect(output).not.toContain("--runtime");
  });
});
