import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyCommand } from "../../../components/copy-command";
import { SiteHeader } from "../../../components/site-header";
import { readWorkflowBundleByAuthor } from "../../../lib/registry";
import { buildInstallCommand } from "../../../lib/site";

export const dynamic = "force-dynamic";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ author: string; name: string }>;
}): Promise<React.ReactNode> {
  const { author, name } = await params;
  const bundle = await readWorkflowBundleByAuthor(author, name);

  if (!bundle) {
    notFound();
  }

  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        <div className="detail-layout">
          <section className="detail-main">
            <div className="breadcrumbs">
              <Link href="/">workflows</Link>
              <span>/</span>
              <span>{bundle.metadata.author}</span>
              <span>/</span>
              <span>{bundle.metadata.name}</span>
            </div>

            <h1 className="detail-title">{bundle.metadata.name}</h1>
            <CopyCommand value={buildInstallCommand(bundle.metadata)} />

            <div className="content-card">
              <div className="content-label">
                {bundle.metadata.smart ? "SMART WORKFLOW" : "WORKFLOW"}
              </div>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h2>{children}</h2>,
                }}
              >
                {stripLeadingTitle(bundle.readme)}
              </ReactMarkdown>
            </div>
          </section>

          <aside className="detail-sidebar">
            <div className="sidebar-block">
              <p className="sidebar-label">Providers</p>
              <p>
                {bundle.metadata.provider.length > 0 ? bundle.metadata.provider.join(", ") : "none"}
              </p>
            </div>
            <div className="sidebar-block">
              <p className="sidebar-label">Runtimes</p>
              <p>
                {bundle.metadata.runtimes.length > 0 ? bundle.metadata.runtimes.join(", ") : "none"}
              </p>
            </div>
            <div className="sidebar-block">
              <p className="sidebar-label">Runners</p>
              <p>
                {bundle.metadata.runners.length > 0 ? bundle.metadata.runners.join(", ") : "none"}
              </p>
            </div>
            <div className="sidebar-block">
              <p className="sidebar-label">Repository</p>
              <p>{bundle.metadata.repository ?? `${bundle.metadata.author}/workflows`}</p>
            </div>
            <div className="sidebar-block">
              <p className="sidebar-label">Triggers</p>
              <p>{bundle.metadata.triggers.join(", ")}</p>
            </div>
            <div className="sidebar-block">
              <p className="sidebar-label">Required secrets</p>
              {Object.keys(bundle.metadata.requiredSecrets).length === 0 ? (
                <p>none</p>
              ) : (
                <ul>
                  {Object.entries(bundle.metadata.requiredSecrets).map(([provider, secrets]) => (
                    <li key={provider}>
                      <strong>{provider}</strong>: {secrets.join(", ")}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="sidebar-block">
              <p className="sidebar-label">First seen</p>
              <p>{bundle.metadata.publishedAt ?? "2026-03-09"}</p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function stripLeadingTitle(markdown: string): string {
  return markdown.replace(/^# .+\n+/, "");
}
