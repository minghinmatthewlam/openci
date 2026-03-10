import { CopyCommand } from '../../components/copy-command';
import { SiteHeader } from '../../components/site-header';
import { docsSections } from '../../lib/site';

export default function DocsPage(): React.ReactNode {
  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        <div className="docs-layout">
          <aside className="docs-sidebar">
            {docsSections.map((section) => (
              <a key={section.href} href={section.href} className={section.href === '/docs' ? 'docs-link active' : 'docs-link'}>
                {section.label}
              </a>
            ))}
          </aside>

          <article className="docs-content">
            <h1>Documentation</h1>
            <p className="docs-intro">
              Learn how to discover, install, and use OpenCI workflows in your repositories.
            </p>

            <section>
              <h2>What are workflows?</h2>
              <p>
                OpenCI workflows are reusable GitHub Actions automations for AI agents. They provide procedural
                automation that helps repositories ship review, security, and release workflows faster.
              </p>
            </section>

            <section id="cli">
              <h2>Getting started</h2>
              <p>Install a workflow with the `openci` CLI:</p>
              <CopyCommand value="$ npx openci add ai-pr-review --provider claude" />
              <p>
                This installs the workflow and generates the GitHub Actions file in <code>.github/workflows/</code>.
              </p>
            </section>

            <section>
              <h2>How workflows are ranked</h2>
              <p>
                The leaderboard ranks workflows using anonymous install counts collected by the OpenCI CLI. The signal is
                limited to workflow popularity and does not require repository or user identifiers.
              </p>
            </section>

            <section>
              <h2>Browse workflows</h2>
              <p>Visit the homepage to search the workflow leaderboard and inspect each workflow detail page.</p>
            </section>

            <section id="faq">
              <h2>FAQ</h2>
              <p>
                OpenCI supports official registry installs, local workflow sources, and GitHub repo sources. Smart
                workflows use <code>openci.config.json</code> for substitution and provider-specific defaults.
              </p>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
