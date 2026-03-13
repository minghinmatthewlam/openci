import { z } from "zod";

export const InstallationSchema = z.object({
  name: z.string(),
  source: z.string(),
  workflow: z.string(),
  commit: z.string().optional(),
  contentHash: z.string().optional(),
  targetPath: z.string(),
  installedAt: z.string(),
});

export type Installation = z.infer<typeof InstallationSchema>;
