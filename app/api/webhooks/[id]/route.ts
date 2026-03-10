import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { webhookEndpoints } from '@/lib/db/notifications-schema';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const { id } = await params;
    const endpointId = parseInt(id, 10);
    if (isNaN(endpointId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const deleted = await db
      .delete(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, endpointId),
          eq(webhookEndpoints.teamId, team.id)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/webhooks/[id]] DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const { id } = await params;
    const endpointId = parseInt(id, 10);
    if (isNaN(endpointId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { isActive, events } = body as { isActive?: boolean; events?: string[] };

    const updateData: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (Array.isArray(events)) updateData.events = events;

    const updated = await db
      .update(webhookEndpoints)
      .set(updateData)
      .where(
        and(
          eq(webhookEndpoints.id, endpointId),
          eq(webhookEndpoints.teamId, team.id)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated[0] });
  } catch (err) {
    console.error('[api/webhooks/[id]] PATCH error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
