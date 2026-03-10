import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { evaluateAllFlags, evaluateFlags } from '@/lib/feature-flags/engine';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      // Return empty flags for unauthenticated requests instead of 401
      return NextResponse.json({ flags: {} });
    }

    let teamId: number | undefined;
    try {
      const team = await getTeamForUser();
      teamId = team?.id;
    } catch {
      // team fetch is best-effort
    }

    const context = { userId: user.id, teamId };

    let body: { keys?: string[] } = {};
    try {
      body = (await request.json()) as { keys?: string[] };
    } catch {
      // empty body is fine
    }

    const keys = body.keys;
    let flags: Record<string, boolean>;

    if (!keys || keys.length === 0) {
      // Evaluate all flags
      flags = await evaluateAllFlags(context);
    } else {
      flags = await evaluateFlags(keys, context);
    }

    return NextResponse.json({ flags });
  } catch (err) {
    console.error('[api/feature-flags/evaluate] POST error:', err);
    return NextResponse.json({ flags: {} });
  }
}
