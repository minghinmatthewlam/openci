import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { atomicWrite } from "../../src/utils/atomic-write.js";

describe("atomicWrite", () => {
  let dir: string;

  afterEach(async () => {
    // tmp dirs are cleaned up by the OS
  });

  it("writes content to a file", async () => {
    dir = await mkdtemp(join(tmpdir(), "atomic-write-"));
    const filePath = join(dir, "output.yml");

    await atomicWrite(filePath, "name: test\n");

    expect(await readFile(filePath, "utf8")).toBe("name: test\n");
  });

  it("creates parent directories", async () => {
    dir = await mkdtemp(join(tmpdir(), "atomic-write-"));
    const filePath = join(dir, "nested", "deep", "output.yml");

    await atomicWrite(filePath, "content");

    expect(await readFile(filePath, "utf8")).toBe("content");
  });

  it("overwrites existing files", async () => {
    dir = await mkdtemp(join(tmpdir(), "atomic-write-"));
    const filePath = join(dir, "output.yml");

    await atomicWrite(filePath, "old content");
    await atomicWrite(filePath, "new content");

    expect(await readFile(filePath, "utf8")).toBe("new content");
  });

  it("does not leave a .tmp file on success", async () => {
    dir = await mkdtemp(join(tmpdir(), "atomic-write-"));
    const filePath = join(dir, "output.yml");

    await atomicWrite(filePath, "content");

    await expect(stat(`${filePath}.tmp`)).rejects.toThrow();
  });
});
