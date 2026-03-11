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
              Learn how to browse, install, and manage OpenCI workflows in your repositories.
            </p>

            <section>
              <h2>What is OpenCI?</h2>
              <p>
                OpenCI is an open-source CLI for installing AI-agent GitHub Actions workflows from official, local, or
                git-based sources.
              </p>
            </section>

            <section id="cli">
              <h2>Getting started</h2>
              <p>Install a workflow from a source:</p>
              <CopyCommand value="$ npx openci add ./workflows --workflow pr-review" />
              <p>
                This generates a workflow file in <code>.github/workflows/</code> and records sidecar metadata for
                later updates.
              </p>
            </section>

            <section>
              <h2>How discovery works</h2>
              <p>
                The Phase 3 site lists official workflows from the public repository. It is a simple OSS directory,
                without hosted search or telemetry-backed rankings.
              </p>
            </section>

            <section>
              <h2>Browse workflows</h2>
              <p>Use the homepage to filter official workflows and inspect their detail pages before installing them.</p>
            </section>

            <section id="faq">
              <h2>FAQ</h2>
              <p>
                OpenCI supports workflows and smart workflows. Smart workflows use <code>openci.config.json</code> for
                local detection and substitution when generating the installed YAML.
              </p>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
