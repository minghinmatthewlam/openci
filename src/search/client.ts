import { CliError } from "../core/errors.js";
import { createOpenCiApiClient, type SearchResponse } from "@matthewlam/openci-contracts";

function getSearchUrl(): string {
  const value = process.env.OPENCI_SEARCH_URL?.trim();
  return value ? value : "https://api.openci.app";
}

export async function searchCatalog(query: string): Promise<SearchResponse> {
  try {
    const client = createOpenCiApiClient({ baseUrl: getSearchUrl() });
    return await client.search(query);
  } catch {
    throw new CliError("Search service unavailable.");
  }
}
