import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { webhookEndpoints } from '@/lib/db/notifications-schema';
import { getDeliveryHistory } from '@/lib/notifications/webhook-dispatcher';

export async function GET(
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

    // Verify ownership
    const endpoint = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, endpointId),
          eq(webhookEndpoints.teamId, team.id)
        )
      )
      .limit(1);

    if (endpoint.length === 0) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    const deliveries = await getDeliveryHistory(endpointId, Math.min(limit, 100));
    return NextResponse.json({ data: deliveries });
  } catch (err) {
    console.error('[api/webhooks/[id]/deliveries] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
