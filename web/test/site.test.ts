import { describe, expect, it } from "vitest";
import { buildInstallCommand } from "../lib/site";

describe("buildInstallCommand", () => {
  it("builds a source-first command for provider-backed workflows", () => {
    expect(
      buildInstallCommand({
        name: "pr-review",
        displayName: "Pull Request Review",
        description: "",
        tags: [],
        provider: ["claude", "codex"],
        runtimes: ["action", "script"],
        runners: ["github-ubuntu", "self-hosted-a8"],
        defaultRuntime: "action",
        defaultRunner: "github-ubuntu",
        smart: true,
        stacks: [],
        author: "openci",
        repository: "minghinmatthewlam/openci",
      }),
    ).toBe("npx openci add minghinmatthewlam/openci --workflow pr-review --provider claude");
  });

  it("includes runtime and runner when the workflow defaults require them", () => {
    expect(
      buildInstallCommand({
        name: "security-scan",
        displayName: "Security Scan",
        description: "",
        tags: [],
        provider: ["glm"],
        runtimes: ["script"],
        runners: ["self-hosted-a8"],
        defaultRuntime: "script",
        defaultRunner: "self-hosted-a8",
        smart: true,
        stacks: [],
        author: "openci",
        repository: "minghinmatthewlam/openci",
      }),
    ).toBe(
      "npx openci add minghinmatthewlam/openci --workflow security-scan --provider glm --runtime script --runner self-hosted-a8",
    );
  });

  it("omits provider flags for providerless workflows", () => {
    expect(
      buildInstallCommand({
        name: "review-gate",
        displayName: "Review Gate",
        description: "",
        tags: [],
        provider: [],
        runtimes: [],
        runners: ["github-ubuntu"],
        defaultRunner: "github-ubuntu",
        smart: false,
        stacks: [],
        author: "openci",
        repository: "minghinmatthewlam/openci",
      }),
    ).toBe("npx openci add minghinmatthewlam/openci --workflow review-gate");
  });
});
