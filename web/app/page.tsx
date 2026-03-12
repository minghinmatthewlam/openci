import { CopyCommand } from "../components/copy-command";
import { LeaderboardTable } from "../components/leaderboard-table";
import { SiteHeader } from "../components/site-header";
import { listRegistryWorkflows } from "../lib/registry";
import { buildInstallCommand } from "../lib/site";

export const dynamic = "force-dynamic";

const ASCII_LOGO = ` ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗██╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██║
██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║
╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗██║
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝`;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<React.ReactNode> {
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const allWorkflows = await listRegistryWorkflows();
  const items = allWorkflows
    .filter((workflow) => {
      if (!query) {
        return true;
      }

      return [
        workflow.name,
        workflow.displayName,
        workflow.description,
        ...workflow.tags,
        ...workflow.provider,
        ...workflow.runtimes,
        ...workflow.runners,
        ...workflow.stacks,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .map((workflow) => ({
      workflow,
      href: `/${workflow.author ?? "openci"}/${workflow.name}`,
      providers: workflow.provider,
    }));
  const featuredWorkflow = allWorkflows.find((workflow) => workflow.name === "pr-review") ??
    allWorkflows[0] ?? {
      name: "pr-review",
      displayName: "Pull Request Review",
      description: "",
      tags: [],
      provider: ["claude"],
      runtimes: ["action"],
      runners: ["github-ubuntu"],
      defaultRuntime: "action",
      defaultRunner: "github-ubuntu",
      smart: true,
      stacks: [],
      author: "openci",
      repository: "minghinmatthewlam/openci",
    };

  return (
    <>
      <SiteHeader />

      <main className="page-shell">
        {/* Hero */}
        <section className="py-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            OpenCI v1.0 is now available
          </div>

          <div className="mb-10 w-full overflow-x-auto flex justify-center no-scrollbar">
            <pre className="font-mono text-[0.55rem] sm:text-[0.7rem] md:text-xs lg:text-sm xl:text-base leading-tight text-white font-bold select-none text-left drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              {ASCII_LOGO}
            </pre>
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-6 max-w-2xl leading-snug">
            AI Agents for your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">
              GitHub Workflows
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
            The easiest way to discover, install, and manage AI-powered GitHub Actions. Bring
            Claude, Codex, GLM, and custom providers into your pull requests and issue flows.
          </p>

          <div className="w-full max-w-md">
            <CopyCommand value={buildInstallCommand(featuredWorkflow)} />
          </div>
        </section>

        {/* Workflow list */}
        <section className="leaderboard-section">
          <p className="section-label">Official workflows</p>
          <form className="search-form">
            <input
              className="search-input"
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Search workflows..."
              aria-label="Search workflows"
            />
            <button className="search-button" type="submit">
              Search
            </button>
          </form>

          <LeaderboardTable
            items={items}
            emptyState="No official workflows match that query yet."
          />
        </section>
      </main>
    </>
  );
}
