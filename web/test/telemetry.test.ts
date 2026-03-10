import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getWorkflowMetrics, readInstallEvents, recordInstallEvent } from '../lib/telemetry';

describe('telemetry store', () => {
  afterEach(() => {
    delete process.env.OPENCI_WEB_TELEMETRY_PATH;
  });

  it('records install events in the configured file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'openci-web-telemetry-'));
    process.env.OPENCI_WEB_TELEMETRY_PATH = join(dir, 'events.json');

    await recordInstallEvent({
      workflow: 'ai-pr-review',
      provider: 'claude',
      workflowVersion: '1.0.0',
      cliVersion: '0.1.0',
      installedAt: new Date().toISOString(),
    });

    const events = await readInstallEvents();
    const raw = await readFile(process.env.OPENCI_WEB_TELEMETRY_PATH, 'utf8');

    expect(events).toHaveLength(1);
    expect(raw).toContain('"workflow": "ai-pr-review"');
  });

  it('merges seed counts with recorded events', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'openci-web-metrics-'));
    process.env.OPENCI_WEB_TELEMETRY_PATH = join(dir, 'events.json');

    await recordInstallEvent({
      workflow: 'ai-pr-review',
      provider: 'claude',
      workflowVersion: '1.0.0',
      cliVersion: '0.1.0',
      installedAt: new Date().toISOString(),
    });

    const metrics = await getWorkflowMetrics('ai-pr-review');

    expect(metrics.allTime).toBeGreaterThan(470900);
    expect(metrics.providerBreakdown.claude).toBe(1);
  });
});
