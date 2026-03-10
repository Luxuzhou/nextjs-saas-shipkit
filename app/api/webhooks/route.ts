import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { webhookEndpoints } from '@/lib/db/notifications-schema';
import { ALL_WEBHOOK_EVENTS } from '@/lib/notifications/types';
import type { WebhookEvent } from '@/lib/notifications/types';

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

    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.teamId, team.id));

    return NextResponse.json({ data: endpoints });
  } catch (err) {
    console.error('[api/webhooks] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { url, events } = body as { url?: string; events?: string[] };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Validate events
    const validEvents = (events ?? ALL_WEBHOOK_EVENTS).filter((e) =>
      ALL_WEBHOOK_EVENTS.includes(e as WebhookEvent)
    );

    const secret = randomBytes(32).toString('hex');

    const result = await db
      .insert(webhookEndpoints)
      .values({
        teamId: team.id,
        url,
        secret,
        events: validEvents,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (err) {
    console.error('[api/webhooks] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
