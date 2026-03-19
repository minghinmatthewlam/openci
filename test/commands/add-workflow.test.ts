import { execFileSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helpers/cli.js";
import { installFakeGh } from "../helpers/fake-gh.js";
import { startHttpServer } from "../helpers/http.js";
import { sourceRepoFixture } from "../helpers/paths.js";

describe("add command", () => {
  let tempDir: string;
  const servers: Array<{ close(): Promise<void> }> = [];

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "openci-add-test-"));
    execFileSync("git", ["init", "--initial-branch=main", tempDir], {
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.email", "test@test.com"], {
      cwd: tempDir,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.name", "Test"], {
      cwd: tempDir,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "commit.gpgsign", "false"], {
      cwd: tempDir,
      stdio: "ignore",
    });
    // Create an initial commit so git rev-parse works
    await writeFile(join(tempDir, "README.md"), "test", "utf8");
    execFileSync("git", ["add", "."], { cwd: tempDir, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", "init"], {
      cwd: tempDir,
      stdio: "ignore",
    });
  });

  afterEach(async () => {
    while (servers.length > 0) {
      await servers.pop()!.close();
    }
    await rm(tempDir, { recursive: true, force: true });
  });

  it("lists available workflows when --workflow is omitted", async () => {
    const result = await runCli(["add", sourceRepoFixture], { cwd: tempDir });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("pr-review");
    expect(result.stdout).toContain("issue-triage");
    expect(result.stdout).toContain("ci");
    expect(result.stdout).toContain("3 workflow(s) found");
  });

  it("installs a workflow file", async () => {
    const result = await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--yes"], {
      cwd: tempDir,
    });
    expect(result.error).toBeUndefined();

    const targetPath = join(tempDir, ".github", "workflows", "pr-review.yml");
    const content = await readFile(targetPath, "utf8");
    expect(content).toContain("anthropics/claude-code-action");
  });

  it("creates sidecar metadata", async () => {
    await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--yes"], {
      cwd: tempDir,
    });

    const metadataPath = join(tempDir, ".github", "workflows", ".openci", "pr-review.json");
    const raw = await readFile(metadataPath, "utf8");
    const data = JSON.parse(raw);
    expect(data.name).toBe("pr-review");
    expect(data.source).toBe(sourceRepoFixture);
    expect(data.contentHash).toBeTruthy();
  });

  it("refuses to overwrite without --force", async () => {
    await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--yes"], {
      cwd: tempDir,
    });
    const result = await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--yes"], {
      cwd: tempDir,
    });
    expect(result.error).toBeDefined();
    expect((result.error as Error).message).toContain("already exists");
  });

  it("overwrites with --force", async () => {
    await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--yes"], {
      cwd: tempDir,
    });
    const result = await runCli(
      ["add", sourceRepoFixture, "--workflow", "pr-review", "--yes", "--force"],
      { cwd: tempDir },
    );
    expect(result.error).toBeUndefined();
  });

  it("dry-run does not write files", async () => {
    const result = await runCli(
      ["add", sourceRepoFixture, "--workflow", "pr-review", "--dry-run"],
      { cwd: tempDir },
    );
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("Would install");

    const targetPath = join(tempDir, ".github", "workflows", "pr-review.yml");
    await expect(access(targetPath)).rejects.toThrow();
  });

  it("shows post-install intelligence in interactive mode", async () => {
    const result = await runCli(["add", sourceRepoFixture, "--workflow", "pr-review"], {
      cwd: tempDir,
    });
    expect(result.error).toBeUndefined();
    expect(result.stdout).toContain("Provider:");
    expect(result.stdout).toContain("Claude");
    expect(result.stdout).toContain("Triggers:");
  });

  it("installs .yaml extension workflows", async () => {
    const result = await runCli(["add", sourceRepoFixture, "--workflow", "ci", "--yes"], {
      cwd: tempDir,
    });
    expect(result.error).toBeUndefined();

    const targetPath = join(tempDir, ".github", "workflows", "ci.yaml");
    const content = await readFile(targetPath, "utf8");
    expect(content).toContain("npm test");
  });

  it("rejects setup flags in list mode", async () => {
    const result = await runCli(["add", sourceRepoFixture, "--setup"], { cwd: tempDir });
    expect(result.error).toBeDefined();
    expect((result.error as Error).message).toContain("Setup flags require --workflow");
  });

  it("reports missing secrets in bare setup mode without writing secrets", async () => {
    const fakeGh = await installFakeGh(join(tempDir, "bin"));
    const result = await runCli(
      ["add", sourceRepoFixture, "--workflow", "pr-review", "--setup", "--yes"],
      {
        cwd: tempDir,
        env: {
          PATH: fakeGh.pathValue,
          OPENCI_FAKE_GH_SECRETS: "",
          OPENCI_FAKE_GH_SET_LOG: fakeGh.logPath,
        },
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain(join(tempDir, ".github", "workflows", "pr-review.yml"));
    expect(result.stderr).toContain("Missing secrets: ANTHROPIC_API_KEY");
    await expect(access(fakeGh.logPath)).rejects.toThrow();
  });

  it("configures repo secrets from env values", async () => {
    const fakeGh = await installFakeGh(join(tempDir, "bin"));
    const result = await runCli(
      [
        "add",
        sourceRepoFixture,
        "--workflow",
        "pr-review",
        "--setup",
        "--copy-env",
        "ANTHROPIC_API_KEY",
        "--yes",
      ],
      {
        cwd: tempDir,
        env: {
          PATH: fakeGh.pathValue,
          OPENCI_FAKE_GH_SECRETS: "",
          OPENCI_FAKE_GH_SET_LOG: fakeGh.logPath,
          ANTHROPIC_API_KEY: "env-secret",
          OPENAI_API_KEY: "",
        },
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(0);
    expect(await readFile(fakeGh.logPath, "utf8")).toContain("ANTHROPIC_API_KEY=env-secret");
  });

  it("prefers explicit --secret values over env-based setup", async () => {
    const fakeGh = await installFakeGh(join(tempDir, "bin"));
    const result = await runCli(
      [
        "add",
        sourceRepoFixture,
        "--workflow",
        "pr-review",
        "--setup",
        "--copy-env",
        "ANTHROPIC_API_KEY",
        "--secret",
        "ANTHROPIC_API_KEY=explicit-secret",
        "--yes",
      ],
      {
        cwd: tempDir,
        env: {
          PATH: fakeGh.pathValue,
          OPENCI_FAKE_GH_SECRETS: "",
          OPENCI_FAKE_GH_SET_LOG: fakeGh.logPath,
          ANTHROPIC_API_KEY: "env-secret",
        },
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(0);
    expect(await readFile(fakeGh.logPath, "utf8")).toContain("ANTHROPIC_API_KEY=explicit-secret");
  });

  it("returns exit code 2 when setup is only partially satisfied", async () => {
    const sourceDir = await mkdtemp(join(tmpdir(), "openci-add-source-"));
    await mkdir(join(sourceDir, ".github", "workflows"), { recursive: true });
    await writeFile(
      join(sourceDir, ".github", "workflows", "dual.yml"),
      [
        "name: Dual Secrets",
        "on: push",
        "jobs:",
        "  test:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: echo hi",
        "        env:",
        "          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}",
        "          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}",
        "",
      ].join("\n"),
      "utf8",
    );

    const fakeGh = await installFakeGh(join(tempDir, "bin"));
    const result = await runCli(
      [
        "add",
        sourceDir,
        "--workflow",
        "dual",
        "--setup",
        "--copy-env",
        "ANTHROPIC_API_KEY",
        "--yes",
      ],
      {
        cwd: tempDir,
        env: {
          PATH: fakeGh.pathValue,
          OPENCI_FAKE_GH_SECRETS: "",
          OPENCI_FAKE_GH_SET_LOG: fakeGh.logPath,
          ANTHROPIC_API_KEY: "env-secret",
        },
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(2);
    expect(await readFile(fakeGh.logPath, "utf8")).toContain("ANTHROPIC_API_KEY=env-secret");
    expect(result.stderr).toContain("OPENAI_API_KEY");

    await rm(sourceDir, { recursive: true, force: true });
  });

  it("returns JSON-only stdout for setup results", async () => {
    const fakeGh = await installFakeGh(join(tempDir, "bin"));
    const result = await runCli(
      ["add", sourceRepoFixture, "--workflow", "pr-review", "--setup", "--json"],
      {
        cwd: tempDir,
        env: {
          PATH: fakeGh.pathValue,
          OPENCI_FAKE_GH_SECRETS: "",
          OPENCI_FAKE_GH_SET_LOG: fakeGh.logPath,
        },
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: "installed_setup_incomplete",
      workflow: {
        name: "pr-review",
        source: sourceRepoFixture,
      },
      setup: {
        attempted: true,
        missingSecrets: ["ANTHROPIC_API_KEY"],
      },
    });
  });

  it("keeps the install when gh auth is unavailable for setup", async () => {
    const fakeGh = await installFakeGh(join(tempDir, "bin"));
    const result = await runCli(
      ["add", sourceRepoFixture, "--workflow", "pr-review", "--setup", "--yes"],
      {
        cwd: tempDir,
        env: {
          PATH: fakeGh.pathValue,
          OPENCI_FAKE_GH_AUTH: "0",
        },
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(2);
    await expect(
      access(join(tempDir, ".github", "workflows", "pr-review.yml")),
    ).resolves.toBeUndefined();
  });

  it("emits telemetry for public identifiable installs into public destination repos", async () => {
    execFileSync("git", ["remote", "add", "origin", "https://github.com/dest/repo.git"], {
      cwd: tempDir,
      stdio: "ignore",
    });

    const githubApi = await startHttpServer((request, response) => {
      if (request.url === "/repos/acme/workflows/contents/.github/workflows/ci.yml") {
        response.setHeader("Content-Type", "application/json");
        response.end(
          JSON.stringify({
            name: "ci.yml",
            encoding: "base64",
            content: Buffer.from("on: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n").toString(
              "base64",
            ),
          }),
        );
        return;
      }

      if (request.url === "/repos/acme/workflows/commits?per_page=1") {
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify([{ sha: "abc123" }]));
        return;
      }

      if (request.url === "/repos/acme/workflows" || request.url === "/repos/dest/repo") {
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ private: false }));
        return;
      }

      response.statusCode = 404;
      response.end("not found");
    });
    const telemetry = await startHttpServer((_request, response) => {
      response.statusCode = 204;
      response.end();
    });
    servers.push(githubApi, telemetry);

    const result = await runCli(["add", "acme/workflows", "--workflow", "ci", "--yes"], {
      cwd: tempDir,
      env: {
        OPENCI_GITHUB_API_URL: githubApi.url,
        OPENCI_TELEMETRY_URL: ` ${telemetry.url}/ `,
      },
    });

    expect(result.error).toBeUndefined();
    expect(telemetry.requests).toHaveLength(1);
    expect(JSON.parse(telemetry.requests[0]!.body)).toMatchObject({
      event: "install_success",
      slug: "github/acme/workflows/ci",
      destinationRepo: "dest/repo",
    });
    expect(telemetry.requests[0]!.url).toBe("/api/telemetry/install");
  });

  it("suppresses telemetry for local installs", async () => {
    const telemetry = await startHttpServer((_request, response) => {
      response.statusCode = 204;
      response.end();
    });
    servers.push(telemetry);

    const result = await runCli(["add", sourceRepoFixture, "--workflow", "ci", "--yes"], {
      cwd: tempDir,
      env: {
        OPENCI_TELEMETRY_URL: ` ${telemetry.url} `,
      },
    });

    expect(result.error).toBeUndefined();
    expect(telemetry.requests).toHaveLength(0);
  });
});
