import { z } from "zod";

export const ManifestInstallationSchema = z.object({
  name: z.string(),
  source: z.string(),
  provider: z.string(),
  model: z.string().optional(),
  trigger: z.string().optional(),
  branch: z.string().optional(),
  smart: z.boolean(),
  workflowVersion: z.string(),
  targetPath: z.string(),
  installedAt: z.string(),
});
export type ManifestInstallation = z.infer<typeof ManifestInstallationSchema>;
