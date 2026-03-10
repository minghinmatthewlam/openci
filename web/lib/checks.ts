import { listRegistryWorkflows, readWorkflowBundle } from './registry';

export type CheckStatus = 'pass' | 'warn';

export interface WorkflowCheck {
  label: string;
  status: CheckStatus;
}

export interface WorkflowAuditSummary {
  workflow: string;
  author: string;
  href: string;
  checks: WorkflowCheck[];
}

function buildWorkflowHref(author: string, workflow: string): string {
  return `/${author}/${workflow}`;
}

export async function getWorkflowChecks(workflowName: string): Promise<WorkflowCheck[]> {
  const bundle = await readWorkflowBundle(workflowName);
  if (!bundle) {
    return [
      { label: 'metadata', status: 'warn' },
      { label: 'content', status: 'warn' },
    ];
  }

  return [
    { label: 'metadata', status: 'pass' },
    { label: 'readme', status: bundle.readme.trim() ? 'pass' : 'warn' },
    { label: 'registry entry', status: 'pass' },
    {
      label: 'provider secrets',
      status: Object.keys(bundle.metadata.requiredSecrets).length > 0 ? 'pass' : 'warn',
    },
  ];
}

export async function getAuditSummaries(): Promise<WorkflowAuditSummary[]> {
  const workflows = await listRegistryWorkflows();

  return Promise.all(
    workflows.map(async (workflow) => ({
      workflow: workflow.name,
      author: workflow.author ?? 'openci',
      href: buildWorkflowHref(workflow.author ?? 'openci', workflow.name),
      checks: await getWorkflowChecks(workflow.name),
    })),
  );
}
