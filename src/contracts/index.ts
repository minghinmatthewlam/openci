import { z } from "zod";

export const SearchWorkflowSchema = z.object({
  slug: z.string(),
  source: z.string(),
  workflow: z.string(),
  title: z.string(),
  summary: z.string(),
  provider: z.string(),
  triggers: z.array(z.string()),
  requiredSecretsCount: z.number().int().nonnegative(),
  curated: z.boolean(),
  stars: z.number().int().nonnegative(),
  installs: z.number().int().nonnegative(),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  count: z.number().int().nonnegative(),
  results: z.array(SearchWorkflowSchema),
});

export const TelemetryInstallEventSchema = z.object({
  event: z.literal("install_success"),
  slug: z.string().min(1),
  cliVersion: z.string().min(1),
  dateBucket: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  destinationRepo: z
    .string()
    .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/)
    .optional(),
});

export type SearchWorkflow = z.infer<typeof SearchWorkflowSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type TelemetryInstallEvent = z.infer<typeof TelemetryInstallEventSchema>;

export interface OpenCiApiClientOptions {
  baseUrl: string;
  fetchFn?: typeof fetch;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

export function createOpenCiApiClient(options: OpenCiApiClientOptions) {
  const fetchFn = options.fetchFn ?? fetch;
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  return {
    async search(query: string): Promise<SearchResponse> {
      const url = new URL(`${baseUrl}/api/search`);
      url.searchParams.set("q", query);
      const response = await fetchFn(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}.`);
      }

      return SearchResponseSchema.parse(await response.json());
    },

    async trackInstall(payload: TelemetryInstallEvent): Promise<void> {
      const response = await fetchFn(`${baseUrl}/api/telemetry/install`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(TelemetryInstallEventSchema.parse(payload)),
        signal: AbortSignal.timeout(3_000),
      });

      if (!response.ok) {
        throw new Error(`Telemetry request failed with status ${response.status}.`);
      }
    },
  };
}
