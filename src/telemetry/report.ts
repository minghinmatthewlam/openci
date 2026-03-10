import packageJson from '../../package.json' with { type: 'json' };

interface InstallReportEvent {
  workflow: string;
  provider: string;
  workflowVersion: string;
  cliVersion: string;
  installedAt: string;
}

function isDoNotTrackEnabled(): boolean {
  const value = process.env.DO_NOT_TRACK?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function getAnalyticsUrl(): string | undefined {
  if (isDoNotTrackEnabled()) {
    return undefined;
  }

  return process.env.OPENCI_ANALYTICS_URL?.trim() || undefined;
}

export async function reportInstallEvent(event: Omit<InstallReportEvent, 'cliVersion'>): Promise<void> {
  const url = getAnalyticsUrl();
  if (!url) {
    return;
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'openci-cli',
      },
      body: JSON.stringify({
        ...event,
        cliVersion: packageJson.version,
      } satisfies InstallReportEvent),
      signal: AbortSignal.timeout(2_500),
    });
  } catch {
    // Telemetry must never block installs.
  }
}
