import { describe, expect, it } from "vitest";
import { buildInstallCommand } from "../lib/site";

describe("buildInstallCommand", () => {
  it("builds a command from source and workflow", () => {
    expect(buildInstallCommand("anthropics/claude-code", "claude")).toBe(
      "npx openci-app add anthropics/claude-code --workflow claude",
    );
  });

  it("handles source with org prefix", () => {
    expect(buildInstallCommand("google-github-actions/run-gemini-cli", "gemini-review")).toBe(
      "npx openci-app add google-github-actions/run-gemini-cli --workflow gemini-review",
    );
  });

  it("handles simple source names", () => {
    expect(buildInstallCommand("openai/codex", "issue-labeler")).toBe(
      "npx openci-app add openai/codex --workflow issue-labeler",
    );
  });
});
