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
              Learn how to browse, install, and manage OpenCI workflows in your repositories.
            </p>

            <section>
              <h2>What is OpenCI?</h2>
              <p>
                OpenCI is an open-source CLI for installing AI-agent GitHub Actions workflows from
                official, local, or git-based sources.
              </p>
            </section>

            <section>
              <h2>Getting started</h2>
              <p>Install an official workflow from the public source:</p>
              <CopyCommand value="npx openci add minghinmatthewlam/openci --workflow pr-review --provider claude" />
              <p>
                This generates a workflow file in <code>.github/workflows/</code> and records
                sidecar metadata for later updates.
              </p>
            </section>

            <section>
              <h2>Providers, runtimes, and runners</h2>
              <p>
                OpenCI separates the AI provider from the runtime and runner. A workflow can target
                Claude, Codex, GLM, or no provider at all, then choose an action runtime or a script
                runtime, and finally render onto a GitHub-hosted or self-hosted runner.
              </p>
              <CopyCommand value="npx openci add minghinmatthewlam/openci --workflow security-scan --provider glm --runtime script --runner self-hosted-a8" />
            </section>

            <section>
              <h2>How discovery works</h2>
              <p>
                The site lists official workflows from the public repository. It is a simple
                OSS directory, without hosted search or telemetry-backed rankings.
              </p>
            </section>

            <section>
              <h2>Browse workflows</h2>
              <p>
                Use the homepage to filter official workflows and inspect their detail pages before
                installing them.
              </p>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
