import { getDestinationRepoIdentity, getDestinationRepoVisibility } from "../github/identity.js";
import { createOpenCiApiClient, type TelemetryInstallEvent } from "@matthewlam/openci-contracts";

function telemetryDisabled(): boolean {
  return process.env.OPENCI_DISABLE_TELEMETRY === "1" || process.env.DO_NOT_TRACK === "1";
}

function getTelemetryUrl(): string {
  const value = process.env.OPENCI_TELEMETRY_URL?.trim();
  return value ? value : "https://openci.app";
}

function buildDateBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function trackInstallSuccess(params: {
  slug: string | undefined;
  repoRoot: string;
  cliVersion: string;
}): Promise<void> {
  if (telemetryDisabled() || !params.slug) return;

  const visibility = await getDestinationRepoVisibility(params.repoRoot);
  if (visibility !== "public") return;
  const destinationRepo = getDestinationRepoIdentity(params.repoRoot);
  if (!destinationRepo) return;

  const payload: TelemetryInstallEvent = {
    event: "install_success",
    slug: params.slug,
    cliVersion: params.cliVersion,
    dateBucket: buildDateBucket(),
    destinationRepo,
  };

  try {
    const client = createOpenCiApiClient({ baseUrl: getTelemetryUrl() });
    await client.trackInstall(payload);
  } catch {
    // Telemetry must never affect command behavior.
  }
}
