import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyCommand } from "../../../components/copy-command";
import { SiteHeader } from "../../../components/site-header";
import { getCatalogEntry } from "../../../lib/registry";
import { buildInstallCommand } from "../../../lib/site";

export const dynamic = "force-dynamic";

function ProviderBadge({ provider }: { provider: string }): React.ReactNode {
  const colors: Record<string, string> = {
    claude: "bg-orange-500/15 text-orange-300 border-orange-500/20",
    codex: "bg-green-500/15 text-green-300 border-green-500/20",
    gemini: "bg-blue-500/15 text-blue-300 border-blue-500/20",
    copilot: "bg-purple-500/15 text-purple-300 border-purple-500/20",
    none: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[provider] ?? colors.none}`}
    >
      {provider === "none" ? "No AI provider" : provider}
    </span>
  );
}

function MetadataBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <div className="sidebar-block">
      <p className="sidebar-label">{label}</p>
      {children}
    </div>
  );
}

export default async function CatalogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactNode> {
  const { id } = await params;
  const entry = getCatalogEntry(id);

  if (!entry) {
    notFound();
  }

  const installCmd = buildInstallCommand(entry.source, entry.workflow);

  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        <div className="detail-layout">
          <section className="detail-main">
            <div className="breadcrumbs">
              <Link href="/">catalog</Link>
              <span>/</span>
              <span>{entry.id}</span>
            </div>

            <h1 className="detail-title">{entry.displayName}</h1>
            <p className="text-lg text-zinc-400 mb-6">{entry.description}</p>

            <div className="mb-8">
              <ProviderBadge provider={entry.provider} />
            </div>

            <CopyCommand value={installCmd} />

            {entry.highlights.length > 0 && (
              <div className="content-card mt-8">
                <div className="content-label">HIGHLIGHTS</div>
                <ul className="list-disc space-y-2 text-zinc-300">
                  {entry.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <aside className="detail-sidebar">
            <MetadataBlock label="Source">
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white break-all"
                style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}
              >
                {entry.source}
              </a>
            </MetadataBlock>

            <MetadataBlock label="Provider">
              <p>{entry.provider === "none" ? "None" : entry.provider}</p>
            </MetadataBlock>

            <MetadataBlock label="Category">
              <p>{entry.category}</p>
            </MetadataBlock>

            <MetadataBlock label="Triggers">
              <p>{entry.triggers.length > 0 ? entry.triggers.join(", ") : "none"}</p>
            </MetadataBlock>

            <MetadataBlock label="Required secrets">
              {entry.secrets.length === 0 ? (
                <p>none</p>
              ) : (
                <ul>
                  {entry.secrets.map((s) => (
                    <li key={s}>
                      <code>{s}</code>
                    </li>
                  ))}
                </ul>
              )}
            </MetadataBlock>

            <MetadataBlock label="Tags">
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white/5 text-zinc-400 border border-white/10"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </MetadataBlock>

            <MetadataBlock label="Added">
              <p>{entry.addedAt}</p>
            </MetadataBlock>
          </aside>
        </div>
      </main>
    </>
  );
}
