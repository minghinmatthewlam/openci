import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "../helpers/cli.js";
import { startHttpServer, type TestHttpServer } from "../helpers/http.js";

describe("search command", () => {
  let server: TestHttpServer | undefined;

  afterEach(async () => {
    await server?.close();
    server = undefined;
  });

  it("prints human-readable search results", async () => {
    server = await startHttpServer((_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          query: "triage",
          count: 1,
          results: [
            {
              slug: "github/anthropics/claude-code/claude-issue-triage",
              source: "anthropics/claude-code",
              workflow: "claude-issue-triage",
              title: "Claude Issue Triage",
              summary: "Auto-triage new issues with Claude",
              provider: "Claude",
              triggers: ["issues", "issue_comment"],
              requiredSecretsCount: 1,
              curated: true,
              stars: 12345,
              installs: 582,
            },
          ],
        }),
      );
    });

    const result = await runCli(["search", "triage"], {
      env: { OPENCI_SEARCH_URL: `  ${server.url}/  ` },
    });

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Claude Issue Triage");
    expect(result.stdout).toContain("anthropics/claude-code");
    expect(result.stdout).toContain(
      "openci add anthropics/claude-code --workflow claude-issue-triage",
    );
    expect(server.requests).toHaveLength(1);
    expect(server.requests[0]!.url).toBe("/api/search?q=triage");
  });

  it("prints pure JSON with --json", async () => {
    server = await startHttpServer((_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          query: "triage",
          count: 1,
          results: [
            {
              slug: "github/anthropics/claude-code/claude-issue-triage",
              source: "anthropics/claude-code",
              workflow: "claude-issue-triage",
              title: "Claude Issue Triage",
              summary: "Auto-triage new issues with Claude",
              provider: "Claude",
              triggers: ["issues"],
              requiredSecretsCount: 1,
              curated: true,
              stars: 100,
              installs: 3,
            },
          ],
        }),
      );
    });

    const result = await runCli(["search", "triage", "--json"], {
      env: { OPENCI_SEARCH_URL: ` ${server.url} ` },
    });

    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual({
      query: "triage",
      count: 1,
      results: [
        {
          slug: "github/anthropics/claude-code/claude-issue-triage",
          source: "anthropics/claude-code",
          workflow: "claude-issue-triage",
          title: "Claude Issue Triage",
          summary: "Auto-triage new issues with Claude",
          provider: "Claude",
          triggers: ["issues"],
          requiredSecretsCount: 1,
          curated: true,
          stars: 100,
          installs: 3,
        },
      ],
    });
  });

  it("returns empty results successfully", async () => {
    server = await startHttpServer((_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ query: "none", count: 0, results: [] }));
    });

    const result = await runCli(["search", "none"], {
      env: { OPENCI_SEARCH_URL: ` ${server.url}/ ` },
    });

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('No workflows found for "none".');
  });

  it("fails on API errors", async () => {
    server = await startHttpServer((_req, res) => {
      res.statusCode = 500;
      res.end("boom");
    });

    const result = await runCli(["search", "triage"], {
      env: { OPENCI_SEARCH_URL: `\n${server.url}\n` },
    });

    expect(result.error).toBeDefined();
    expect((result.error as Error).message).toContain("Search service unavailable");
  });
});
