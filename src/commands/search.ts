import type { Command } from "commander";
import { searchCatalog } from "../search/client.js";

function formatInstalls(installs: number): string {
  return `${installs} install${installs === 1 ? "" : "s"}`;
}

function formatStars(stars: number): string {
  return `${stars} star${stars === 1 ? "" : "s"}`;
}

export function registerSearchCommand(program: Command): void {
  program
    .command("search")
    .description("Search cataloged workflows")
    .argument("<query>", "Search query")
    .option("--json", "Output JSON")
    .action(async (query: string, options: { json?: boolean }) => {
      const result = await searchCatalog(query);

      if (options.json) {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        return;
      }

      if (result.count === 0) {
        process.stdout.write(`No workflows found for "${query}".\n`);
        return;
      }

      for (const workflow of result.results) {
        const parts = [
          workflow.provider,
          formatInstalls(workflow.installs),
          workflow.curated ? "curated" : undefined,
          formatStars(workflow.stars),
        ].filter(Boolean);

        process.stdout.write(`${workflow.title} (${workflow.workflow})\n`);
        process.stdout.write(`  ${workflow.source}`);
        if (parts.length > 0) {
          process.stdout.write(`  ${parts.join(" · ")}`);
        }
        process.stdout.write("\n");
        process.stdout.write(`  ${workflow.summary}\n`);
        process.stdout.write(`  openci add ${workflow.source} --workflow ${workflow.workflow}\n\n`);
      }
    });
}
