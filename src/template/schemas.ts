import { z } from "zod";
import { RuntimeSchema } from "../registry/schemas.js";

export const DetectionKeySchema = z.enum([
  "packageManager",
  "nodeVersion",
  "defaultBranch",
  "validationCommand",
  "framework",
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
  defaults: z
    .object({
      provider: z.string().optional(),
      runner: z.string().optional(),
      runtime: RuntimeSchema.optional(),
    })
    .default({}),
  providerModes: z
    .record(
      z.string(),
      z.object({
        runtime: RuntimeSchema.optional(),
        runner: z.string().optional(),
        action: z
          .object({
            action: z.string(),
            authKey: z.string().optional(),
            secretName: z.string().optional(),
            extraArgs: z.string().optional(),
          })
          .optional(),
        script: z
          .object({
            env: z.record(z.string(), z.string()).optional(),
            run: z.string(),
          })
          .optional(),
      }),
    )
    .default({}),
  runners: z
    .record(
      z.string(),
      z.object({
        runsOn: z.union([z.string(), z.array(z.string())]),
      }),
    )
    .default({}),
  substitutions: z.record(z.string(), SubstitutionRuleSchema),
});

export type OpenCiConfig = z.infer<typeof OpenCiConfigSchema>;
export type DetectionKey = z.infer<typeof DetectionKeySchema>;
