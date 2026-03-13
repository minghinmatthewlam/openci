import { CopyCommand } from "../../components/copy-command";
import { DocsSidebar } from "../../components/docs-sidebar";
import { SiteHeader } from "../../components/site-header";

export default function DocsPage(): React.ReactNode {
  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        <div className="docs-layout">
          <DocsSidebar current="/docs" />

          <article className="docs-content">
            <h1>Documentation</h1>
            <p className="docs-intro">
              Learn how to discover, install, and manage GitHub Actions workflows from any
              repository.
            </p>

            <section>
              <h2>What is OpenCI?</h2>
              <p>
                OpenCI is a workflow installer for GitHub Actions. It lets you browse a catalog of
                production workflows from real repos and install them into your own project with a
                single command.
              </p>
            </section>

            <section>
              <h2>Getting started</h2>
              <p>Install a workflow from any GitHub repository:</p>
              <CopyCommand value="npx openci add anthropics/claude-code --workflow claude" />
              <p>
                This downloads the workflow file into <code>.github/workflows/</code> and records
                sidecar metadata in <code>.github/workflows/.openci/</code> for later updates.
              </p>
            </section>

            <section>
              <h2>How it works</h2>
              <p>
                OpenCI reads workflow files directly from GitHub repositories. When you run{" "}
                <code>openci add</code>, it fetches the specified workflow from the source repo,
                writes it into your project, and saves metadata so you can update or remove it
                later.
              </p>
              <p>
                There are no proprietary templates or hosted registries. Every workflow you install
                comes from a real <code>.github/workflows/</code> directory in an actual repository.
              </p>
            </section>

            <section>
              <h2>The catalog</h2>
              <p>
                The homepage lists workflows from popular open-source repositories. Browse by
                category (code review, issue automation, security, etc.) or filter by AI provider
                (Claude, Codex, Gemini). Each entry links to the source file on GitHub.
              </p>
            </section>

            <section>
              <h2>Managing installed workflows</h2>
              <p>
                After installing workflows, use <code>openci list</code> to see what you have,{" "}
                <code>openci status</code> to check for drift, and <code>openci update</code> to
                pull the latest version from the source repo.
              </p>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
