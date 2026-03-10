import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { featureFlags } from '@/lib/db/feature-flags-schema';
import { invalidateCache } from '@/lib/feature-flags/engine';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateFlagSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['boolean', 'percentage', 'userList', 'teamList']).optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
  targetUserIds: z.array(z.number()).optional(),
  targetTeamIds: z.array(z.number()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body: unknown = await request.json();
    const parsed = updateFlagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Partial<typeof featureFlags.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.rolloutPercentage !== undefined)
      updateData.rolloutPercentage = data.rolloutPercentage;
    if (data.targetUserIds !== undefined)
      updateData.targetUserIds = data.targetUserIds;
    if (data.targetTeamIds !== undefined)
      updateData.targetTeamIds = data.targetTeamIds;

    const [updated] = await db
      .update(featureFlags)
      .set(updateData)
      .where(eq(featureFlags.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    invalidateCache();
    return NextResponse.json({ flag: updated });
  } catch (err) {
    console.error('[api/feature-flags/[id]] PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [deleted] = await db
      .delete(featureFlags)
      .where(eq(featureFlags.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    invalidateCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/feature-flags/[id]] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
