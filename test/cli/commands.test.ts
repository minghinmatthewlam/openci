import { describe, expect, it } from "vitest";
import { buildCli } from "../../src/cli.js";

async function runCommand(args: string[]): Promise<void> {
  await buildCli("0.1.0").parseAsync(args, { from: "user" });
}

describe("CLI commands", () => {
  it("init is registered as a non-failing stub", async () => {
    await expect(runCommand(["init"])).resolves.toBeUndefined();
  });
});
