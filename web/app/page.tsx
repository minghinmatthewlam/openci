import Link from 'next/link';
import { CopyCommand } from '../components/copy-command';
import { LeaderboardTable } from '../components/leaderboard-table';
import { SiteHeader } from '../components/site-header';
import { getLeaderboard, type LeaderboardView } from '../lib/leaderboard';
import { buildInstallCommand, featuredAgents } from '../lib/site';

const views: Array<{ label: string; value: LeaderboardView }> = [
  { label: 'All Time', value: 'all-time' },
  { label: 'Trending (24h)', value: 'trending' },
  { label: 'Hot', value: 'hot' },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: LeaderboardView }>;
}): Promise<React.ReactNode> {
  const params = await searchParams;
  const view = views.some((entry) => entry.value === params.view) ? (params.view as LeaderboardView) : 'all-time';
  const items = await getLeaderboard(view, params.q);

  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="hero-grid">
        <div className="hero-logo-wrap">
          <pre className="hero-logo" aria-hidden="true">
            {` ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗██╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██║
██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║
╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗██║
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝`}
          </pre>
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
        <form className="search-form">
          <input
            className="search-input"
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Search workflows..."
            aria-label="Search workflows"
          />
          <input type="hidden" name="view" value={view} />
          <button className="search-button" type="submit">
            /
          </button>
        </form>

        <div className="view-tabs">
          {views.map((entry) => (
            <Link
              key={entry.value}
              href={`/?view=${entry.value}${params.q ? `&q=${encodeURIComponent(params.q)}` : ''}`}
              className={entry.value === view ? 'view-tab active' : 'view-tab'}
            >
              {entry.label}
            </Link>
          ))}
        </div>

        <LeaderboardTable items={items} emptyState="No workflows match that search yet." />
      </section>
    </main>
  );
}
