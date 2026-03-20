import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../helpers/cli.js";
import { createFakeGh } from "../helpers/gh.js";
import { startHttpServer, type TestHttpServer } from "../helpers/http.js";
import { sourceRepoFixture } from "../helpers/paths.js";

async function initGitRepo(dir: string): Promise<void> {
  execFileSync("git", ["init", "--initial-branch=main", dir], { stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "test@test.com"], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["config", "commit.gpgsign", "false"], { cwd: dir, stdio: "ignore" });
  await writeFile(join(dir, "README.md"), "test", "utf8");
  execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "init"], { cwd: dir, stdio: "ignore" });
}

describe("add command setup and telemetry", () => {
  let tempDir: string;
  let targetRepo: string;
  let telemetryServer: TestHttpServer | undefined;
  let githubServer: TestHttpServer | undefined;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "openci-add-setup-"));
    targetRepo = join(tempDir, "target");
    await mkdir(targetRepo, { recursive: true });
    await initGitRepo(targetRepo);
  });

  afterEach(async () => {
    await telemetryServer?.close();
    await githubServer?.close();
    await rm(tempDir, { recursive: true, force: true });
  });

  it("rejects setup flags in list mode", async () => {
    const result = await runCli(["add", sourceRepoFixture, "--setup"], { cwd: targetRepo });
    expect(result.error).toBeDefined();
    expect((result.error as Error).message).toContain("Setup flags require --workflow");
  });

  it("reports missing secrets with bare --setup and exit code 2", async () => {
    const ghDir = join(tempDir, "gh-bin");
    await createFakeGh(ghDir, { auth: true, secrets: [] });

    const result = await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--setup"], {
      cwd: targetRepo,
      env: { PATH: `${ghDir}:${process.env.PATH}` },
    });

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("Installed pr-review.yml");
    expect(result.stdout).toContain("--copy-env ANTHROPIC_API_KEY");
    expect(result.stderr).toContain("Missing secrets: ANTHROPIC_API_KEY");
  });

  it("configures repo secrets from env in json mode", async () => {
    const ghDir = join(tempDir, "gh-bin");
    const logPath = join(tempDir, "gh.log");
    await createFakeGh(ghDir, {
      auth: true,
      secrets: [],
      logPath,
    });

    const result = await runCli(
      [
        "add",
        sourceRepoFixture,
        "--workflow",
        "pr-review",
        "--setup",
        "--copy-env",
        "ANTHROPIC_API_KEY",
        "--json",
      ],
      {
        cwd: targetRepo,
        env: {
          PATH: `${ghDir}:${process.env.PATH}`,
          ANTHROPIC_API_KEY: "from-env",
        },
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual({
      status: "installed_and_configured",
      workflow: {
        name: "pr-review",
        source: sourceRepoFixture,
        targetPath: ".github/workflows/pr-review.yml",
      },
      setup: {
        attempted: true,
        requiredSecrets: ["ANTHROPIC_API_KEY"],
        configuredSecrets: ["ANTHROPIC_API_KEY"],
        missingSecrets: [],
        nextCommand: null,
      },
    });
    expect(await readFile(logPath, "utf8")).toContain("ANTHROPIC_API_KEY=from-env");
  });

  it("prefers --secret over env-based setup sources", async () => {
    const ghDir = join(tempDir, "gh-bin");
    const logPath = join(tempDir, "gh.log");
    await createFakeGh(ghDir, {
      auth: true,
      secrets: [],
      logPath,
    });

    const result = await runCli(
      [
        "add",
        sourceRepoFixture,
        "--workflow",
        "pr-review",
        "--setup",
        "--copy-env",
        "ANTHROPIC_API_KEY",
        "--all-from-env",
        "--secret",
        "ANTHROPIC_API_KEY=explicit",
      ],
      {
        cwd: targetRepo,
        env: {
          PATH: `${ghDir}:${process.env.PATH}`,
          ANTHROPIC_API_KEY: "from-env",
        },
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(0);
    expect(await readFile(logPath, "utf8")).toContain("ANTHROPIC_API_KEY=explicit");
  });

  it("returns exit code 2 for partial setup success", async () => {
    const sourceDir = join(tempDir, "source");
    await mkdir(join(sourceDir, ".github", "workflows"), { recursive: true });
    await writeFile(
      join(sourceDir, ".github", "workflows", "double.yml"),
      `name: Double
on: push
jobs:
  demo:
    runs-on: ubuntu-latest
    steps:
      - run: echo hi
        env:
          ALPHA: \${{ secrets.ALPHA }}
          BETA: \${{ secrets.BETA }}
`,
      "utf8",
    );

    const ghDir = join(tempDir, "gh-bin");
    const logPath = join(tempDir, "gh.log");
    await createFakeGh(ghDir, { auth: true, secrets: [], logPath });

    const result = await runCli(
      ["add", sourceDir, "--workflow", "double", "--setup", "--secret", "ALPHA=one", "--json"],
      {
        cwd: targetRepo,
        env: { PATH: `${ghDir}:${process.env.PATH}` },
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(2);
    expect(JSON.parse(result.stdout)).toEqual({
      status: "installed_setup_incomplete",
      workflow: {
        name: "double",
        source: sourceDir,
        targetPath: ".github/workflows/double.yml",
      },
      setup: {
        attempted: true,
        requiredSecrets: ["ALPHA", "BETA"],
        configuredSecrets: ["ALPHA"],
        missingSecrets: ["BETA"],
        nextCommand: `openci add ${sourceDir} --workflow double --setup --copy-env BETA`,
      },
    });
    expect(await readFile(logPath, "utf8")).toContain("ALPHA=one");
  });

  it("returns exit code 2 when gh is unauthenticated but install succeeds", async () => {
    const ghDir = join(tempDir, "gh-bin");
    await createFakeGh(ghDir, { auth: false, secrets: [] });

    const result = await runCli(["add", sourceRepoFixture, "--workflow", "pr-review", "--setup"], {
      cwd: targetRepo,
      env: { PATH: `${ghDir}:${process.env.PATH}` },
    });

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("Setup unavailable");
    expect(
      await readFile(join(targetRepo, ".github", "workflows", "pr-review.yml"), "utf8"),
    ).toContain("anthropics/claude-code-action");
  });

  it("emits minimal telemetry for public github installs into public destination repos", async () => {
    execFileSync("git", ["remote", "add", "origin", "https://github.com/acme/target.git"], {
      cwd: targetRepo,
      stdio: "ignore",
    });

    const workflowContent = await readFile(
      join(sourceRepoFixture, ".github", "workflows", "pr-review.yml"),
      "utf8",
    );

    githubServer = await startHttpServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      const url = req.url ?? "/";
      if (url === "/repos/owner/repo" || url === "/repos/acme/target") {
        res.end(JSON.stringify({ private: false }));
        return;
      }
      if (url === "/repos/owner/repo/contents/.github/workflows/pr-review.yml") {
        res.end(
          JSON.stringify({
            name: "pr-review.yml",
            encoding: "base64",
            content: Buffer.from(workflowContent).toString("base64"),
          }),
        );
        return;
      }
      if (url === "/repos/owner/repo/commits?per_page=1") {
        res.end(JSON.stringify([{ sha: "abc123" }]));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "not found" }));
    });

    telemetryServer = await startHttpServer((_req, res) => {
      res.statusCode = 204;
      res.end();
    });

    const result = await runCli(["add", "owner/repo", "--workflow", "pr-review", "--yes"], {
      cwd: targetRepo,
      env: {
        OPENCI_GITHUB_API_URL: githubServer.url,
        OPENCI_TELEMETRY_URL: ` ${telemetryServer.url}/ `,
      },
    });

    expect(result.error).toBeUndefined();
    expect(telemetryServer.requests).toHaveLength(1);
    expect(telemetryServer.requests[0]!.url).toBe("/api/telemetry/install");
    expect(JSON.parse(telemetryServer.requests[0]!.body)).toMatchObject({
      event: "install_success",
      slug: "github/owner/repo/pr-review",
      cliVersion: "0.0.0-dev",
      destinationRepo: "acme/target",
    });
    expect(Object.keys(JSON.parse(telemetryServer.requests[0]!.body)).sort()).toEqual([
      "cliVersion",
      "dateBucket",
      "destinationRepo",
      "event",
      "slug",
    ]);
  });

  it("suppresses telemetry for private destination repos", async () => {
    execFileSync("git", ["remote", "add", "origin", "https://github.com/acme/private-target.git"], {
      cwd: targetRepo,
      stdio: "ignore",
    });

    const workflowContent = await readFile(
      join(sourceRepoFixture, ".github", "workflows", "pr-review.yml"),
      "utf8",
    );

    githubServer = await startHttpServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      const url = req.url ?? "/";
      if (url === "/repos/owner/repo") {
        res.end(JSON.stringify({ private: false }));
        return;
      }
      if (url === "/repos/acme/private-target") {
        res.end(JSON.stringify({ private: true }));
        return;
      }
      if (url === "/repos/owner/repo/contents/.github/workflows/pr-review.yml") {
        res.end(
          JSON.stringify({
            name: "pr-review.yml",
            encoding: "base64",
            content: Buffer.from(workflowContent).toString("base64"),
          }),
        );
        return;
      }
      if (url === "/repos/owner/repo/commits?per_page=1") {
        res.end(JSON.stringify([{ sha: "abc123" }]));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "not found" }));
    });

    telemetryServer = await startHttpServer((_req, res) => {
      res.statusCode = 204;
      res.end();
    });

    const result = await runCli(["add", "owner/repo", "--workflow", "pr-review", "--yes"], {
      cwd: targetRepo,
      env: {
        OPENCI_GITHUB_API_URL: githubServer.url,
        OPENCI_TELEMETRY_URL: ` ${telemetryServer.url} `,
      },
    });

    expect(result.error).toBeUndefined();
    expect(telemetryServer.requests).toHaveLength(0);
  });

  it("suppresses telemetry for private source repos", async () => {
    execFileSync("git", ["remote", "add", "origin", "https://github.com/acme/target.git"], {
      cwd: targetRepo,
      stdio: "ignore",
    });

    const workflowContent = await readFile(
      join(sourceRepoFixture, ".github", "workflows", "pr-review.yml"),
      "utf8",
    );

    githubServer = await startHttpServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      const url = req.url ?? "/";
      if (url === "/repos/owner/private-repo") {
        res.end(JSON.stringify({ private: true }));
        return;
      }
      if (url === "/repos/acme/target") {
        res.end(JSON.stringify({ private: false }));
        return;
      }
      if (url === "/repos/owner/private-repo/contents/.github/workflows/pr-review.yml") {
        res.end(
          JSON.stringify({
            name: "pr-review.yml",
            encoding: "base64",
            content: Buffer.from(workflowContent).toString("base64"),
          }),
        );
        return;
      }
      if (url === "/repos/owner/private-repo/commits?per_page=1") {
        res.end(JSON.stringify([{ sha: "abc123" }]));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "not found" }));
    });

    telemetryServer = await startHttpServer((_req, res) => {
      res.statusCode = 204;
      res.end();
    });

    const result = await runCli(["add", "owner/private-repo", "--workflow", "pr-review", "--yes"], {
      cwd: targetRepo,
      env: {
        OPENCI_GITHUB_API_URL: githubServer.url,
        OPENCI_TELEMETRY_URL: ` ${telemetryServer.url} `,
      },
    });

    expect(result.error).toBeUndefined();
    expect(telemetryServer.requests).toHaveLength(0);
  });
});
