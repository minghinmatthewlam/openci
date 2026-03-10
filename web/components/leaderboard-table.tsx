import Link from 'next/link';
import type { RegistryEntry } from '../lib/registry';

export interface LeaderboardItem {
  href: string;
  providers: string[];
  workflow: RegistryEntry;
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
        <span>Workflow</span>
        <span>Providers</span>
      </div>

      {items.map((item) => (
        <Link key={item.workflow.name} href={item.href} className="leaderboard-row">
          <span className="row-copy">
            <strong>{item.workflow.name}</strong>
            <span className="row-meta">{item.workflow.description}</span>
          </span>
          <span>{item.providers.join(', ')}</span>
        </Link>
      ))}
    </div>
  );
}
