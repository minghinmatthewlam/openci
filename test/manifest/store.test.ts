import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteInstallationMetadata,
  getInstallationMetadataDir,
  getInstallationMetadataPath,
  listInstallationMetadata,
  readInstallationMetadata,
  upsertInstallationMetadata,
} from "../../src/manifest/store.js";

describe("manifest/store", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "openci-store-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("getInstallationMetadataDir returns correct path", () => {
    expect(getInstallationMetadataDir("/repo")).toBe(
      join("/repo", ".github", "workflows", ".openci"),
    );
  });

  it("getInstallationMetadataPath returns correct path", () => {
    expect(getInstallationMetadataPath("/repo", "ci")).toBe(
      join("/repo", ".github", "workflows", ".openci", "ci.json"),
    );
  });

  it("listInstallationMetadata returns empty array for missing dir", async () => {
    const result = await listInstallationMetadata(tempDir);
    expect(result).toEqual([]);
  });

  it("upsertInstallationMetadata writes and reads back", async () => {
    await upsertInstallationMetadata(tempDir, {
      name: "ci",
      source: "owner/repo",
      workflow: "ci",
      targetPath: join(tempDir, ".github", "workflows", "ci.yml"),
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await readInstallationMetadata(tempDir, "ci");
    expect(result).toBeDefined();
    expect(result!.name).toBe("ci");
    expect(result!.source).toBe("owner/repo");
    expect(result!.targetPath).toBe(join(".github", "workflows", "ci.yml"));
  });

  it("listInstallationMetadata returns sorted entries", async () => {
    for (const name of ["zebra", "alpha", "middle"]) {
      await upsertInstallationMetadata(tempDir, {
        name,
        source: "test/repo",
        workflow: name,
        targetPath: join(tempDir, ".github", "workflows", `${name}.yml`),
        installedAt: "2026-01-01T00:00:00.000Z",
      });
    }

    const list = await listInstallationMetadata(tempDir);
    expect(list.map((i) => i.name)).toEqual(["alpha", "middle", "zebra"]);
  });

  it("listInstallationMetadata warns on unparseable JSON", async () => {
    const sidecarDir = getInstallationMetadataDir(tempDir);
    await mkdir(sidecarDir, { recursive: true });
    await writeFile(join(sidecarDir, "bad.json"), '{"name": 123}', "utf8");

    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const result = await listInstallationMetadata(tempDir);
    expect(result).toEqual([]);
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("Skipping bad.json"));
    stderrSpy.mockRestore();
  });

  it("deleteInstallationMetadata removes the file", async () => {
    await upsertInstallationMetadata(tempDir, {
      name: "to-delete",
      source: "test/repo",
      workflow: "to-delete",
      targetPath: join(tempDir, ".github", "workflows", "to-delete.yml"),
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(await readInstallationMetadata(tempDir, "to-delete")).toBeDefined();
    await deleteInstallationMetadata(tempDir, "to-delete");
    expect(await readInstallationMetadata(tempDir, "to-delete")).toBeUndefined();
  });

  it("deleteInstallationMetadata is safe on missing file", async () => {
    await expect(deleteInstallationMetadata(tempDir, "nonexistent")).resolves.toBeUndefined();
  });

  it("upsertInstallationMetadata stores optional fields", async () => {
    await upsertInstallationMetadata(tempDir, {
      name: "ci",
      source: "owner/repo",
      workflow: "ci",
      commit: "abc123",
      contentHash: "def456",
      requiredSecrets: ["ALPHA", "BETA"],
      targetPath: join(tempDir, ".github", "workflows", "ci.yml"),
      installedAt: "2026-01-01T00:00:00.000Z",
    });

    const raw = await readFile(getInstallationMetadataPath(tempDir, "ci"), "utf8");
    const data = JSON.parse(raw);
    expect(data.commit).toBe("abc123");
    expect(data.contentHash).toBe("def456");
    expect(data.requiredSecrets).toEqual(["ALPHA", "BETA"]);
  });

  it("reads legacy metadata without requiredSecrets", async () => {
    const sidecarDir = getInstallationMetadataDir(tempDir);
    await mkdir(sidecarDir, { recursive: true });
    await writeFile(
      join(sidecarDir, "legacy.json"),
      JSON.stringify({
        name: "legacy",
        source: "owner/repo",
        workflow: "legacy",
        targetPath: ".github/workflows/legacy.yml",
        installedAt: "2026-01-01T00:00:00.000Z",
      }),
      "utf8",
    );

    const result = await readInstallationMetadata(tempDir, "legacy");
    expect(result).toBeDefined();
    expect(result!.requiredSecrets).toBeUndefined();
  });
});
