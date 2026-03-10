import Link from 'next/link';
import type { Route } from 'next';
import type { RegistryEntry } from '../lib/registry';

export interface LeaderboardItem {
  workflow: RegistryEntry;
  installs: string;
  href: string;
}

export function LeaderboardTable({
  items,
  emptyState,
}: {
  items: LeaderboardItem[];
  emptyState?: string;
}): React.ReactNode {
  if (items.length === 0) {
    return <p className="empty-state">{emptyState ?? 'No workflows found.'}</p>;
  }

  return (
    <div className="leaderboard-table">
      <div className="leaderboard-header">
        <span>#</span>
        <span>Workflow</span>
        <span>Installs</span>
      </div>

      {items.map((item, index) => (
        <Link key={item.workflow.name} href={item.href as Route} className="leaderboard-row">
          <span>{index + 1}</span>
          <span>
            <strong>{item.workflow.name}</strong>
            <span className="row-meta">{item.workflow.author ?? item.workflow.displayName}</span>
          </span>
          <span>{item.installs}</span>
        </Link>
      ))}
    </div>
  );
}
