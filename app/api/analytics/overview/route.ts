import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import {
  getEventsByDateRange,
  getTopEvents,
  getPageViews,
  getUserRetention,
} from '@/lib/analytics/queries';
import { subDays, startOfDay, endOfDay } from 'date-fns';

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

    const now = new Date();
    const range = {
      from: startOfDay(subDays(now, 29)),
      to: endOfDay(now),
    };

    const [eventsByDate, topEvents, pageViews, retention] = await Promise.all([
      getEventsByDateRange(team.id, range),
      getTopEvents(team.id, range),
      getPageViews(team.id, range),
      getUserRetention(team.id, range),
    ]);

    return NextResponse.json({
      eventsByDate,
      topEvents,
      pageViews,
      retention,
    });
  } catch (error) {
    console.error('[Analytics Overview] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
