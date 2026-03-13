import { createHash } from "node:crypto";

export function isWorkflowFile(filename: string): boolean {
  return filename.endsWith(".yml") || filename.endsWith(".yaml");
}

export function stemName(filename: string): string {
  return filename.replace(/\.ya?ml$/, "");
}

export function computeHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
