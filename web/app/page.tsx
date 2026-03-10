import { CopyCommand } from '../components/copy-command';
import { LeaderboardControls } from '../components/leaderboard-controls';
import { LeaderboardTable } from '../components/leaderboard-table';
import { SiteHeader } from '../components/site-header';
import { getLeaderboard, type LeaderboardView } from '../lib/leaderboard';
import { buildInstallCommand, featuredAgents } from '../lib/site';

export const dynamic = 'force-dynamic';
const validViews: LeaderboardView[] = ['all-time', 'trending', 'hot'];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: LeaderboardView }>;
}): Promise<React.ReactNode> {
  const params = await searchParams;
  const view = params.view && validViews.includes(params.view) ? params.view : 'all-time';
  const items = await getLeaderboard(view, params.q);

  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="hero-grid">
        <div className="hero-logo-wrap">
          <div className="hero-wordmark" aria-hidden="true">
            OPENCI
          </div>
          <p className="eyebrow">THE OPEN WORKFLOW ECOSYSTEM</p>
        </div>

        <div className="hero-copy">
          <p>
            Workflows are reusable GitHub Actions automations for AI agents. Install them with a single command to
            enhance your repositories with review, security, and release automation.
          </p>
        </div>
      </section>

      <section className="top-panels">
        <div>
          <p className="section-label">Try it now</p>
          <CopyCommand value={buildInstallCommand('ai-pr-review')} />
        </div>

        <div>
          <p className="section-label">Available for these agents</p>
          <div className="agent-strip">
            {featuredAgents.map((agent) => (
              <span key={agent} className="agent-pill">
                {agent}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="leaderboard-section">
        <p className="section-label">Workflow leaderboard</p>
        <LeaderboardControls initialQuery={params.q} initialView={view} />

        <LeaderboardTable items={items} emptyState="No workflows match that search yet." />
      </section>
    </main>
  );
}
