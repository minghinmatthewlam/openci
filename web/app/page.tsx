import Link from "next/link";
import { LeaderboardTable } from "../components/leaderboard-table";
import { RotatingCommand } from "../components/rotating-command";
import { SearchInput } from "../components/search-input";
import { SiteHeader } from "../components/site-header";
import { getCategories, listCatalogWorkflows } from "../lib/registry";

export const dynamic = "force-dynamic";

const ASCII_LOGO = ` ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗██╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██║
██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║
╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗██║
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝`;

const PROVIDER_FILTERS = [
  { label: "Claude", value: "claude" },
  { label: "Codex", value: "codex" },
  { label: "Gemini", value: "gemini" },
  { label: "Copilot", value: "copilot" },
];

function FilterTabs({ current, query }: { current: string; query: string }): React.ReactNode {
  const categories = getCategories();

  const filters = [
    { label: "All", value: "" },
    ...categories.map((c) => ({ label: c.displayName, value: c.id })),
    ...PROVIDER_FILTERS,
  ];

  return (
    <div className="filter-tabs">
      {filters.map(({ label, value }) => {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (value) params.set("filter", value);
        const href = params.toString() ? `/?${params.toString()}` : "/";

        return (
          <Link
            key={value}
            href={href}
            className={`filter-tab${current === value ? " filter-tab-active" : ""}`}
            prefetch={false}
            scroll={false}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}): Promise<React.ReactNode> {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const filter = params.filter ?? "";
  const workflows = listCatalogWorkflows(query || undefined, filter || undefined);

  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        {/* Hero */}
        <section className="py-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            Install workflows from any repo
          </div>

          <div className="mb-10 w-full overflow-x-auto flex justify-center no-scrollbar">
            <pre className="ascii-logo text-[0.55rem] sm:text-[0.7rem] md:text-xs lg:text-sm xl:text-base leading-tight text-white font-bold select-none text-left drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              {ASCII_LOGO}
            </pre>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-6 max-w-2xl leading-snug">
            The workflow installer for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">
              GitHub Actions
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
            Discover and install production workflows from real repos. One command to add Claude,
            Codex, Gemini, and more to your CI.
          </p>

          <div className="w-full max-w-md">
            <RotatingCommand />
          </div>
        </section>

        {/* Workflow catalog */}
        <section className="leaderboard-section">
          <p className="section-label">Workflow catalog</p>
          <FilterTabs current={filter} query={query} />
          <SearchInput defaultValue={params.q} />

          <LeaderboardTable workflows={workflows} emptyState="No workflows match that query." />
        </section>
      </main>
    </>
  );
}
