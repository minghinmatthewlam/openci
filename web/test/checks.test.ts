import { describe, expect, it } from 'vitest';
import { getAuditSummaries, getWorkflowChecks } from '../lib/checks';

describe('workflow checks', () => {
  it('computes factual checks for a workflow', async () => {
    const checks = await getWorkflowChecks('ai-pr-review');

    expect(checks.find((check) => check.label === 'metadata')?.status).toBe('pass');
    expect(checks.find((check) => check.label === 'readme')?.status).toBe('pass');
  });

  it('builds audit summaries for the full registry', async () => {
    const summaries = await getAuditSummaries();

    expect(summaries.length).toBeGreaterThan(3);
    expect(summaries[0]?.href).toContain('/');
  });
});
