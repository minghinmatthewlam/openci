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
            <p className="docs-intro">Common questions about OpenCI and the CLI.</p>

            <section>
              <h2>What repos can I install from?</h2>
              <p>
                Any GitHub repository that has workflow files in <code>.github/workflows/</code>.
                Public repos work out of the box. Private repos are supported through your normal
                git credentials (SSH keys, configured tokens, or any auth flow your local git
                already uses). OpenCI does not prompt for credentials itself.
              </p>
            </section>

            <section>
              <h2>How does update detect local changes?</h2>
              <p>
                When you install a workflow, OpenCI records a content hash in the sidecar metadata
                at <code>.github/workflows/.openci/&lt;workflow&gt;.json</code>. On{" "}
                <code>update</code>, it compares the current file hash to the recorded one. If they
                differ, the CLI warns you that local changes exist and asks for confirmation before
                overwriting. Use <code>--force</code> to skip the prompt.
              </p>
            </section>

            <section>
              <h2>What does doctor check?</h2>
              <p>
                The <code>doctor</code> command runs several diagnostics:
              </p>
              <ul>
                <li>
                  Missing sidecar metadata for workflow files that appear to be OpenCI-managed
                </li>
                <li>Orphaned sidecar files with no corresponding workflow</li>
                <li>Source repo accessibility (can the recorded source still be reached?)</li>
                <li>
                  Configuration issues in the <code>.openci/</code> directory
                </li>
              </ul>
            </section>

            <section>
              <h2>How do I find workflows?</h2>
              <p>
                The OpenCI catalog on the homepage lists verified workflows from popular open-source
                repos. You can filter by category (code review, issue automation, security) or by AI
                provider (Claude, Codex, Gemini). Each entry links directly to the source file on
                GitHub.
              </p>
              <p>
                You can also install from any repo you know about — the catalog is just a curated
                starting point.
              </p>
            </section>

            <section>
              <h2>Where does OpenCI store metadata?</h2>
              <p>
                Per-workflow sidecar metadata is stored in{" "}
                <code>.github/workflows/.openci/&lt;workflow&gt;.json</code>. This records the
                source, workflow name, content hash, and install time so <code>list</code>,{" "}
                <code>status</code>, and <code>update</code> work reliably.
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
          </article>
        </div>
      </main>
    </>
  );
}
