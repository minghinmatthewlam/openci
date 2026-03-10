import { NextResponse } from 'next/server';
import { z } from 'zod';
import { recordInstallEvent } from '../../../lib/telemetry';

const InstallEventSchema = z.object({
  workflow: z.string().min(1),
  provider: z.string().min(1),
  workflowVersion: z.string().min(1),
  cliVersion: z.string().min(1),
  installedAt: z.string().min(1),
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = InstallEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid install event.' }, { status: 400 });
  }

  await recordInstallEvent(parsed.data);
  return NextResponse.json({ ok: true });
}
