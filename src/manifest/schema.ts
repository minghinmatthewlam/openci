import { z } from 'zod';

export const ManifestInstallationSchema = z.object({
  name: z.string(),
  source: z.string(),
  provider: z.string(),
  smart: z.boolean(),
  workflowVersion: z.string(),
  targetPath: z.string(),
  installedAt: z.string(),
});

export const ManifestSchema = z.object({
  version: z.literal(1),
  installations: z.array(ManifestInstallationSchema),
});

export type Manifest = z.infer<typeof ManifestSchema>;
export type ManifestInstallation = z.infer<typeof ManifestInstallationSchema>;
