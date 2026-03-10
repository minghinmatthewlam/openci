import { buildWorkflowHref, formatInstallCount } from './site';
import { listRegistryWorkflows, type RegistryEntry } from './registry';
import { getLeaderboardMetrics } from './telemetry';

export type LeaderboardView = 'all-time' | 'trending' | 'hot';

function scoreFor(
  view: LeaderboardView,
  workflow: RegistryEntry,
  metrics: Awaited<ReturnType<typeof getLeaderboardMetrics>>,
): number {
  const workflowMetrics = metrics[workflow.name];
  switch (view) {
    case 'trending':
      return workflowMetrics?.trending24h ?? 0;
    case 'hot':
      return workflowMetrics?.hotScore ?? 0;
    case 'all-time':
      return workflowMetrics?.allTime ?? 0;
  }
}

export async function getLeaderboard(view: LeaderboardView, query?: string) {
  const workflows = await listRegistryWorkflows();
  const metrics = await getLeaderboardMetrics();
  const normalizedQuery = query?.trim().toLowerCase();

  return workflows
    .filter((workflow) => {
      if (!normalizedQuery) {
        return true;
      }

      return [workflow.name, workflow.displayName, workflow.description, ...workflow.tags, ...workflow.provider, ...workflow.stacks]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((left, right) => scoreFor(view, right, metrics) - scoreFor(view, left, metrics) || left.name.localeCompare(right.name))
    .map((workflow) => ({
      workflow,
      installs: formatInstallCount(scoreFor(view, workflow, metrics)),
      href: buildWorkflowHref(workflow),
    }));
}
