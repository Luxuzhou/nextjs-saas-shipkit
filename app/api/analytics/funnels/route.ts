import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getTeamFunnels, getFunnelConversion } from '@/lib/analytics/queries';
import { db } from '@/lib/db/drizzle';
import { funnels } from '@/lib/db/analytics-schema';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const teamFunnels = await getTeamFunnels(team.id);

    // Get conversion data for each funnel
    const funnelsWithConversion = await Promise.all(
      teamFunnels.map(async (funnel) => {
        const conversion = await getFunnelConversion(funnel.id);
        return { ...funnel, conversion };
      })
    );

    return NextResponse.json({ funnels: funnelsWithConversion });
  } catch (error) {
    console.error('[Analytics Funnels] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      steps?: Array<{ name: string; eventName: string }>;
    };

    if (!body.name || !body.steps || body.steps.length === 0) {
      return NextResponse.json({ error: 'name and steps are required' }, { status: 400 });
    }

    const [newFunnel] = await db
      .insert(funnels)
      .values({
        teamId: team.id,
        name: body.name,
        steps: body.steps,
      })
      .returning();

    return NextResponse.json({ funnel: newFunnel }, { status: 201 });
  } catch (error) {
    console.error('[Analytics Funnels POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
