import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/**
 * Write a file atomically: content goes to a `.tmp` sibling first,
 * then is renamed into place. On the same filesystem `rename` is atomic,
 * so readers never see a half-written file.
 */
export async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = `${filePath}.tmp`;
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(tmp, content, "utf8");
  try {
    await rename(tmp, filePath);
  } catch (error) {
    await unlink(tmp).catch(() => {});
    throw error;
  }
}
