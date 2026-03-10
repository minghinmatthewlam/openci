import { NextResponse } from 'next/server';
import { getLeaderboardMetrics, getWorkflowMetrics } from '../../../../lib/telemetry';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const workflow = url.searchParams.get('workflow');

  if (workflow) {
    return NextResponse.json(await getWorkflowMetrics(workflow));
  }

  return NextResponse.json(await getLeaderboardMetrics());
}
