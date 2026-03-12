import { CopyCommand } from "../../../components/copy-command";
import { DocsSidebar } from "../../../components/docs-sidebar";
import { SiteHeader } from "../../../components/site-header";

export default function CliPage(): React.ReactNode {
  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        <div className="docs-layout">
          <DocsSidebar current="/docs/cli" />

          <article className="docs-content">
            <h1>CLI Reference</h1>
            <p className="docs-intro">
              The CLI is the primary way to install and manage AI-powered workflows for your
              repositories.
            </p>

            <section>
              <h2>Installation</h2>
              <p>The CLI can be run directly with npx — no installation required:</p>
              <CopyCommand value="npx openci add minghinmatthewlam/openci --workflow pr-review" />
            </section>

            <section>
              <h2>Commands</h2>

              <h3>add</h3>
              <p>Install a workflow into your repo from any supported source:</p>
              <CopyCommand value="npx openci add minghinmatthewlam/openci --workflow pr-review --provider claude" />
              <ul>
                <li>
                  <code>--workflow &lt;name&gt;</code> — select a workflow from a multi-workflow
                  source
                </li>
                <li>
                  <code>--provider &lt;name&gt;</code> — choose a provider (claude, codex, glm,
                  custom)
                </li>
                <li>
                  <code>--runtime &lt;name&gt;</code> — override the runtime (action, script)
                </li>
                <li>
                  <code>--runner &lt;name&gt;</code> — override the workflow runner
                </li>
                <li>
                  <code>--model &lt;name&gt;</code> — override the default model
                </li>
                <li>
                  <code>--trigger &lt;event&gt;</code> — override smart workflow trigger
                </li>
                <li>
                  <code>--branch &lt;name&gt;</code> — override smart workflow branch
                </li>
                <li>
                  <code>--yes</code> — non-interactive mode
                </li>
                <li>
                  <code>--dry-run</code> — print target path without writing files
                </li>
                <li>
                  <code>--verbose</code> — show detection and render details
                </li>
              </ul>

              <h3>search</h3>
              <p>Search official workflow metadata:</p>
              <CopyCommand value="npx openci search review" />

              <h3>list</h3>
              <p>Show locally installed workflows in the current repo:</p>
              <CopyCommand value="npx openci list" />

              <h3>status</h3>
              <p>Show local workflow health and filesystem state:</p>
              <CopyCommand value="npx openci status" />

              <h3>update</h3>
              <p>
                Refresh installed workflows from their recorded source metadata. Pass one or more
                names to update specific workflows:
              </p>
              <CopyCommand value="npx openci update pr-review" />

              <h3>info</h3>
              <p>Inspect an official workflow:</p>
              <CopyCommand value="npx openci info pr-review" />

              <h3>create</h3>
              <p>
                Scaffold a new workflow. Add <code>--smart</code> for templated workflows:
              </p>
              <CopyCommand value="npx openci create my-workflow --smart --yes" />
            </section>

            <section>
              <h2>Sources</h2>
              <p>
                The <code>add</code> command accepts multiple source forms:
              </p>
              <ul>
                <li>
                  <strong>GitHub shorthand:</strong> <code>owner/repo</code>
                </li>
                <li>
                  <strong>Git URL:</strong> <code>git@github.com:owner/repo.git</code>,{" "}
                  <code>https://github.com/owner/repo.git</code>
                </li>
                <li>
                  <strong>Local path:</strong> <code>./workflows</code>,{" "}
                  <code>../shared-workflows</code>
                </li>
              </ul>
            </section>

            <section>
              <h2>Non-interactive mode</h2>
              <p>
                In <code>--yes</code> mode, the CLI never prompts. Successful <code>add</code>{" "}
                prints only the created workflow path to stdout. Warnings and secret setup hints go
                to stderr.
              </p>
              <CopyCommand value="npx openci add minghinmatthewlam/openci --workflow pr-review --provider claude --yes" />
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
