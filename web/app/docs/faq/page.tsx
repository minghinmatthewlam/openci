import { DocsSidebar } from "../../../components/docs-sidebar";
import { SiteHeader } from "../../../components/site-header";

export default function FaqPage(): React.ReactNode {
  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        <div className="docs-layout">
          <DocsSidebar current="/docs/faq" />

          <article className="docs-content">
            <h1>FAQ</h1>
            <p className="docs-intro">
              Common questions about OpenCI workflows and the CLI.
            </p>

            <section>
              <h2>What are smart workflows?</h2>
              <p>
                Smart workflows use <code>openci.config.json</code> for local detection and
                substitution when generating the installed YAML. They adapt to your repo's package
                manager, validation command, branch, provider, runtime, and runner automatically.
              </p>
              <p>
                Regular workflows are copied as-is and are best when the stack is fixed or the
                workflow is intentionally opinionated.
              </p>
            </section>

            <section>
              <h2>Which providers are supported?</h2>
              <p>
                OpenCI currently supports Claude, Codex, GLM, and custom providers. Each workflow
                declares which providers it supports in its metadata.
              </p>
            </section>

            <section>
              <h2>Can I use private repos as sources?</h2>
              <p>
                Yes. Private repos are supported through normal git credentials — SSH keys,
                configured git credentials, or any auth flow your local git already uses. OpenCI
                does not prompt for credentials itself.
              </p>
            </section>

            <section>
              <h2>Where does OpenCI store metadata?</h2>
              <p>
                Per-workflow sidecar metadata is stored in{" "}
                <code>.github/workflows/.openci/&lt;workflow&gt;.json</code>. This records the
                source, provider, runtime, runner, version, and install time so{" "}
                <code>list</code>, <code>status</code>, and <code>update</code> work reliably.
              </p>
            </section>

            <section>
              <h2>How does discovery work?</h2>
              <p>
                The site lists official workflows from the public repository. It is a simple OSS
                directory without hosted search or telemetry-backed rankings.
              </p>
            </section>

            <section>
              <h2>What is the difference between action and script runtimes?</h2>
              <p>
                Action runtime uses a GitHub Actions action (like{" "}
                <code>uses: anthropics/claude-code-action</code>). Script runtime runs the AI agent
                directly via a shell script in the workflow, which is useful for self-hosted runners
                or custom setups.
              </p>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
