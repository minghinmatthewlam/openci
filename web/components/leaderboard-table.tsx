import Link from "next/link";
import type { CatalogEntry } from "../lib/registry";
import { buildInstallCommand } from "../lib/site";

const PROVIDER_COLORS: Record<string, string> = {
  claude: "text-orange-400",
  codex: "text-green-400",
  gemini: "text-blue-400",
  copilot: "text-purple-400",
  none: "text-zinc-500",
};

export function LeaderboardTable({
  workflows,
  emptyState,
}: {
  workflows: CatalogEntry[];
  emptyState?: string;
}): React.ReactNode {
  if (workflows.length === 0) {
    return <p className="empty-state">{emptyState ?? "No workflows found."}</p>;
  }

  return (
    <div className="leaderboard-table">
      <div className="leaderboard-header">
        <span>Workflow</span>
        <span className="hidden sm:inline">Source</span>
        <span>Provider</span>
      </div>

      {workflows.map((w) => (
        <Link key={w.id} href={`/catalog/${w.id}`} className="leaderboard-row">
          <span className="row-copy">
            <strong>{w.displayName}</strong>
            <span className="row-meta">
              {w.description}
              <span className="hidden md:inline"> &middot; {w.category}</span>
            </span>
          </span>
          <span className="hidden sm:inline text-zinc-400 text-sm truncate">{w.source}</span>
          <span className={PROVIDER_COLORS[w.provider] ?? PROVIDER_COLORS.none}>
            {w.provider === "none" ? "---" : w.provider}
          </span>
        </Link>
      ))}
    </div>
  );
}
