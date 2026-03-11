import { CopyCommand } from '../components/copy-command';
import { LeaderboardTable } from '../components/leaderboard-table';
import { SiteHeader } from '../components/site-header';
import { listRegistryWorkflows } from '../lib/registry';
import { buildInstallCommand, featuredAgents } from '../lib/site';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<React.ReactNode> {
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? '';
  const items = (await listRegistryWorkflows())
    .filter((workflow) => {
      if (!query) {
        return true;
      }

      return [workflow.name, workflow.displayName, workflow.description, ...workflow.tags, ...workflow.provider, ...workflow.stacks]
        .join(' ')
        .toLowerCase()
        .includes(query);
    })
    .map((workflow) => ({
      workflow,
      href: `/${workflow.author ?? 'openci'}/${workflow.name}`,
      providers: workflow.provider,
    }));

  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        <section className="hero-grid">
          <div className="hero-logo-wrap">
            <div className="hero-wordmark" aria-hidden="true">
              OPENCI
            </div>
            <p className="eyebrow">THE OPEN WORKFLOW ECOSYSTEM</p>
          </div>

          <div className="hero-copy">
            <p>
              Discover official GitHub Actions workflows for AI agents and install them into your repositories with a
              single command.
            </p>
          </div>
        </section>

        <section className="top-panels">
          <div>
            <p className="section-label">Try it now</p>
            <CopyCommand value={buildInstallCommand('pr-review')} />
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
          <p className="section-label">Official workflows</p>
          <form className="search-form">
            <input
              className="search-input"
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Search workflows..."
              aria-label="Search workflows"
            />
            <button className="search-button" type="submit">
              Search
            </button>
          </form>

          <LeaderboardTable items={items} emptyState="No official workflows match that query yet." />
        </section>
      </main>
    </>
  );
}
