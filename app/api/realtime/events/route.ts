import { NextRequest } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { subscribe, presenceChannel, notificationsChannel } from '@/lib/realtime/event-bus';
import { updatePresence } from '@/lib/realtime/presence-manager';
import { RealtimeEvent } from '@/lib/realtime/types';

// GET /api/realtime/events - SSE stream for real-time events
export async function GET(request: NextRequest) {
  // Authenticate user
  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const team = await getTeamForUser();
  if (!team) {
    return new Response(JSON.stringify({ error: 'No team found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const teamId = team.id;
  const encoder = new TextEncoder();

  // Mark user as online when they connect
  updatePresence(
    user.id,
    user.name ?? user.email,
    user.email,
    teamId,
    'online'
  );

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Helper to send SSE message
      function sendEvent(event: RealtimeEvent) {
        try {
          const message = `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Controller may be closed
        }
      }

      // Send initial connection event
      const connectEvent: RealtimeEvent = {
        id: `${Date.now()}-connect`,
        type: 'connection:established',
        channel: 'system',
        payload: {
          userId: user.id,
          teamId,
          message: 'Connected to realtime events',
        },
        timestamp: Date.now(),
      };
      sendEvent(connectEvent);

      // Send keepalive comments every 20 seconds
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepaliveInterval);
        }
      }, 20_000);

      // Subscribe to team channels
      const unsubPresence = subscribe(presenceChannel(teamId), sendEvent);
      const unsubNotifications = subscribe(notificationsChannel(teamId), sendEvent);

      // Handle client disconnect
      const abortHandler = () => {
        clearInterval(keepaliveInterval);
        unsubPresence();
        unsubNotifications();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      cleanup = abortHandler;
      request.signal.addEventListener('abort', abortHandler);
    },
    cancel() {
      if (cleanup) {
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
