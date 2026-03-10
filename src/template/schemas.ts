import { z } from 'zod';

export const DetectionKeySchema = z.enum([
  'packageManager',
  'nodeVersion',
  'defaultBranch',
  'validationCommand',
  'framework',
]);

export const SubstitutionRuleSchema = z
  .object({
    _detect: DetectionKeySchema.optional(),
    _default: z.string().optional(),
  })
  .catchall(z.string());

export const OpenCiConfigSchema = z.object({
  detect: z
    .object({
      packageManager: z.boolean().optional(),
      nodeVersion: z.boolean().optional(),
      defaultBranch: z.boolean().optional(),
      validationCommand: z.boolean().optional(),
      framework: z.boolean().optional(),
    })
    .default({}),
  providers: z.record(z.string(), z.record(z.string(), z.string())),
  substitutions: z.record(z.string(), SubstitutionRuleSchema),
});

export type OpenCiConfig = z.infer<typeof OpenCiConfigSchema>;
export type DetectionKey = z.infer<typeof DetectionKeySchema>;
