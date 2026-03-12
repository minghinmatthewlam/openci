import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CliError } from "../../src/core/errors.js";
import { runCli } from "../helpers/cli.js";
import { registryFixturesUrl } from "../helpers/paths.js";

describe("info command", () => {
  beforeEach(async () => {
    process.env.XDG_CACHE_HOME = await mkdtemp(join(tmpdir(), "openci-info-"));
  });

  afterEach(() => {
    delete process.env.OPENCI_REGISTRY_URL;
    delete process.env.XDG_CACHE_HOME;
  });

  it("prints metadata and README for a workflow", async () => {
    process.env.OPENCI_REGISTRY_URL = registryFixturesUrl;

    const result = await runCli(["info", "pr-review"]);

    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("Pull Request Review");
    expect(result.stdout).toContain("Type: smart workflow");
    expect(result.stdout).toContain("Runtimes: action, script");
    expect(result.stdout).toContain("Runners: github-ubuntu, self-hosted-a8");
    expect(result.stdout).toContain("claude: ANTHROPIC_API_KEY");
    expect(result.stdout).toContain("# Pull Request Review");
  });

  it("errors for a missing workflow", async () => {
    process.env.OPENCI_REGISTRY_URL = registryFixturesUrl;

    const result = await runCli(["info", "missing-workflow"]);

    expect(result.error).toBeInstanceOf(CliError);
    expect((result.error as CliError).message).toBe(
      "Workflow 'missing-workflow' not found. Run `openci search` to browse.",
    );
  });
});
