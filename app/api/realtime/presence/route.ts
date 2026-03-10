import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import {
  updatePresence,
  getTeamPresence,
} from '@/lib/realtime/presence-manager';
import { publish, generateEventId, presenceChannel } from '@/lib/realtime/event-bus';
import { PresenceStatus } from '@/lib/realtime/types';

// POST /api/realtime/presence - update current user's presence status
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const body = await request.json() as { status?: string };
    const status = (body.status ?? 'online') as PresenceStatus;

    if (!['online', 'away', 'offline'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const presence = updatePresence(
      user.id,
      user.name ?? user.email,
      user.email,
      team.id,
      status
    );

    // Publish presence update event to the team channel
    publish(presenceChannel(team.id), {
      id: generateEventId(),
      type: 'presence:update',
      channel: presenceChannel(team.id),
      payload: {
        userId: user.id,
        userName: user.name ?? user.email,
        userEmail: user.email,
        status,
      },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, presence });
  } catch (err) {
    console.error('[api/realtime/presence] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/realtime/presence - get team presence list
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const presence = getTeamPresence(team.id);

    return NextResponse.json({ presence });
  } catch (err) {
    console.error('[api/realtime/presence] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
