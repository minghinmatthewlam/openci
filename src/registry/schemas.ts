import { z } from "zod";

export const RuntimeSchema = z.enum(["action", "script"]);

export const RegistryWorkflowSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  displayName: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  provider: z.array(z.string()),
  runtimes: z.array(RuntimeSchema).default([]),
  runners: z.array(z.string()).default([]),
  defaultRuntime: RuntimeSchema.optional(),
  defaultRunner: z.string().optional(),
  smart: z.boolean(),
  stacks: z.array(z.string()).default([]),
});

export const RegistrySchema = z.object({
  version: z.number().int().positive(),
  updatedAt: z.string(),
  workflows: z.array(RegistryWorkflowSchema),
});

export const WorkflowMetadataSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  displayName: z.string(),
  description: z.string(),
  version: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  provider: z.array(z.string()),
  runtimes: z.array(RuntimeSchema).default([]),
  runners: z.array(z.string()).default([]),
  defaultRuntime: RuntimeSchema.optional(),
  defaultRunner: z.string().optional(),
  smart: z.boolean(),
  requiredSecrets: z.record(z.string(), z.array(z.string())).default({}),
  triggers: z.array(z.string()),
  stacks: z.array(z.string()).optional().default([]),
  minGitHubActionsVersion: z.string().nullable().optional(),
});

export type Registry = z.infer<typeof RegistrySchema>;
export type RegistryWorkflow = z.infer<typeof RegistryWorkflowSchema>;
export type WorkflowMetadata = z.infer<typeof WorkflowMetadataSchema>;
