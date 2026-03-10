import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { trackEvent } from '@/lib/analytics/tracker';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      eventName?: string;
      eventData?: Record<string, unknown>;
      sessionId?: string;
      pageUrl?: string;
      referrer?: string;
      userAgent?: string;
    };

    if (!body.eventName) {
      return NextResponse.json({ error: 'eventName is required' }, { status: 400 });
    }

    const user = await getUser();
    const teamData = user ? await getTeamForUser() : null;

    await trackEvent({
      teamId: teamData?.id ?? null,
      userId: user?.id ?? null,
      eventName: body.eventName,
      eventData: body.eventData ?? null,
      sessionId: body.sessionId ?? null,
      pageUrl: body.pageUrl ?? null,
      referrer: body.referrer ?? null,
      userAgent: body.userAgent ?? request.headers.get('user-agent') ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics Track] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
