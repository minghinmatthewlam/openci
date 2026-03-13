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
              The CLI installs and manages GitHub Actions workflows from any repository.
            </p>

            <section>
              <h2>Installation</h2>
              <p>Run directly with npx — no global install required:</p>
              <CopyCommand value="npx openci add anthropics/claude-code --workflow claude" />
            </section>

            <section>
              <h2>Commands</h2>

              <h3>add</h3>
              <p>Install a workflow from a GitHub repository:</p>
              <CopyCommand value="npx openci add openai/codex --workflow issue-labeler" />
              <ul>
                <li>
                  <code>&lt;source&gt;</code> — GitHub <code>owner/repo</code>, git URL, or local
                  path
                </li>
                <li>
                  <code>--workflow &lt;name&gt;</code> — select a specific workflow file (stem name,
                  no extension)
                </li>
                <li>
                  <code>--force</code> — overwrite an existing workflow without prompting
                </li>
                <li>
                  <code>--dry-run</code> — print what would be written without writing files
                </li>
                <li>
                  <code>--yes</code> — non-interactive mode, skip all prompts
                </li>
                <li>
                  <code>--verbose</code> — show detailed output during install
                </li>
              </ul>

              <h3>list</h3>
              <p>Show all workflows installed via OpenCI in the current repo:</p>
              <CopyCommand value="npx openci list" />

              <h3>status</h3>
              <p>
                Check the health of installed workflows. Reports drift between the local file and
                the recorded source:
              </p>
              <CopyCommand value="npx openci status" />

              <h3>update</h3>
              <p>
                Pull the latest version of installed workflows from their source repos. Pass one or
                more names to update specific workflows:
              </p>
              <CopyCommand value="npx openci update claude" />
              <ul>
                <li>
                  <code>[workflows...]</code> — optional list of workflow names to update
                </li>
                <li>
                  <code>--force</code> — overwrite even if local changes are detected
                </li>
              </ul>

              <h3>remove</h3>
              <p>Remove an installed workflow and its sidecar metadata:</p>
              <CopyCommand value="npx openci remove claude" />

              <h3>doctor</h3>
              <p>
                Run diagnostics on your OpenCI setup. Checks for missing sidecar files, orphaned
                metadata, and configuration issues:
              </p>
              <CopyCommand value="npx openci doctor" />
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
              <CopyCommand value="npx openci add anthropics/claude-code --workflow claude --yes" />
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
