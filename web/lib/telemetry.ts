import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import counts from '../data/install-counts.seed.json';

export interface InstallEvent {
  workflow: string;
  provider: string;
  workflowVersion: string;
  cliVersion: string;
  installedAt: string;
}

export interface WorkflowMetrics {
  allTime: number;
  trending24h: number;
  hotScore: number;
  weeklyInstalls: number;
  providerBreakdown: Record<string, number>;
}

interface SeedCounts {
  allTime: Record<string, number>;
  trending24h: Record<string, number>;
  hotScore: Record<string, number>;
}

const seedCounts = counts as SeedCounts;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultTelemetryPath = path.resolve(currentDir, '../data/telemetry/events.json');

function telemetryPath(): string {
  return process.env.OPENCI_WEB_TELEMETRY_PATH
    ? path.resolve(process.cwd(), process.env.OPENCI_WEB_TELEMETRY_PATH)
    : defaultTelemetryPath;
}

export async function readInstallEvents(): Promise<InstallEvent[]> {
  try {
    const raw = await readFile(telemetryPath(), 'utf8');
    return JSON.parse(raw) as InstallEvent[];
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export async function recordInstallEvent(event: InstallEvent): Promise<void> {
  const filePath = telemetryPath();
  const events = await readInstallEvents();
  events.push(event);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(events, null, 2), 'utf8');
}

export async function getWorkflowMetrics(workflowName: string): Promise<WorkflowMetrics> {
  const events = (await readInstallEvents()).filter((event) => event.workflow === workflowName);
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const last7d = now - 7 * 24 * 60 * 60 * 1000;

  const allTimeEvents = events.length;
  const trendingEvents = events.filter((event) => new Date(event.installedAt).getTime() >= last24h).length;
  const weeklyEvents = events.filter((event) => new Date(event.installedAt).getTime() >= last7d).length;
  const providerBreakdown = events.reduce<Record<string, number>>((accumulator, event) => {
    accumulator[event.provider] = (accumulator[event.provider] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    allTime: (seedCounts.allTime[workflowName] ?? 0) + allTimeEvents,
    trending24h: (seedCounts.trending24h[workflowName] ?? 0) + trendingEvents,
    hotScore: (seedCounts.hotScore[workflowName] ?? 0) + trendingEvents * 5 + weeklyEvents * 2,
    weeklyInstalls: weeklyEvents,
    providerBreakdown,
  };
}

export async function getLeaderboardMetrics(): Promise<Record<string, WorkflowMetrics>> {
  const workflowNames = new Set([
    ...Object.keys(seedCounts.allTime),
    ...Object.keys(seedCounts.trending24h),
    ...Object.keys(seedCounts.hotScore),
    ...(await readInstallEvents()).map((event) => event.workflow),
  ]);

  const entries = await Promise.all(
    Array.from(workflowNames).map(async (workflowName) => [workflowName, await getWorkflowMetrics(workflowName)] as const),
  );

  return Object.fromEntries(entries);
}
