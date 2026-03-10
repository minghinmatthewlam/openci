import { buildWorkflowHref, formatInstallCount } from './site';
import { listRegistryWorkflows, type RegistryEntry } from './registry';
import counts from '../data/install-counts.seed.json';

export type LeaderboardView = 'all-time' | 'trending' | 'hot';

interface SeedCounts {
  allTime: Record<string, number>;
  trending24h: Record<string, number>;
  hotScore: Record<string, number>;
}

const seedCounts = counts as SeedCounts;

function scoreFor(view: LeaderboardView, workflow: RegistryEntry): number {
  switch (view) {
    case 'trending':
      return seedCounts.trending24h[workflow.name] ?? 0;
    case 'hot':
      return seedCounts.hotScore[workflow.name] ?? 0;
    case 'all-time':
      return seedCounts.allTime[workflow.name] ?? 0;
  }
}

export async function getLeaderboard(view: LeaderboardView, query?: string) {
  const workflows = await listRegistryWorkflows();
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
    .sort((left, right) => scoreFor(view, right) - scoreFor(view, left) || left.name.localeCompare(right.name))
    .map((workflow) => ({
      workflow,
      installs: formatInstallCount(scoreFor(view, workflow)),
      href: buildWorkflowHref(workflow),
    }));
}
