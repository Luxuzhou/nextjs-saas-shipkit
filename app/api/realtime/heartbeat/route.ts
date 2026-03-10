import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { heartbeat } from '@/lib/realtime/presence-manager';
import { publish, generateEventId, presenceChannel } from '@/lib/realtime/event-bus';

// POST /api/realtime/heartbeat - keep presence alive (called every 30s from client)
export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    heartbeat(team.id, user.id);

    // Publish a lightweight heartbeat presence event to update teammates
    publish(presenceChannel(team.id), {
      id: generateEventId(),
      type: 'presence:heartbeat',
      channel: presenceChannel(team.id),
      payload: {
        userId: user.id,
        status: 'online',
      },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (err) {
    console.error('[api/realtime/heartbeat] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
