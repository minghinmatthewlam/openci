import { z } from "zod";
import { RuntimeSchema } from "../registry/schemas.js";

export const ManifestInstallationSchema = z.object({
  name: z.string(),
  source: z.string(),
  provider: z.string().optional(),
  runtime: RuntimeSchema.optional(),
  runner: z.string().optional(),
  model: z.string().optional(),
  trigger: z.string().optional(),
  branch: z.string().optional(),
  smart: z.boolean(),
  workflowVersion: z.string(),
  targetPath: z.string(),
  installedAt: z.string(),
});
export type ManifestInstallation = z.infer<typeof ManifestInstallationSchema>;
