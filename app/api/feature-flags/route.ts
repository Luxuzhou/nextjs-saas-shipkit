import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { featureFlags } from '@/lib/db/feature-flags-schema';
import { invalidateCache } from '@/lib/feature-flags/engine';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createFlagSchema = z.object({
  key: z.string().min(1).max(255).regex(/^[a-z0-9_-]+$/, {
    message: 'Key must be lowercase alphanumeric with hyphens/underscores',
  }),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['boolean', 'percentage', 'userList', 'teamList']).default('boolean'),
  enabled: z.boolean().default(false),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
  targetUserIds: z.array(z.number()).optional(),
  targetTeamIds: z.array(z.number()).optional(),
});

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const flags = await db.select().from(featureFlags).orderBy(featureFlags.createdAt);
    return NextResponse.json({ flags });
  } catch (err) {
    console.error('[api/feature-flags] GET error:', err);
    // Return empty data gracefully if table doesn't exist yet
    return NextResponse.json({ flags: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = createFlagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check for duplicate key
    const existing = await db
      .select({ id: featureFlags.id })
      .from(featureFlags)
      .where(eq(featureFlags.key, data.key))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A flag with this key already exists' },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(featureFlags)
      .values({
        key: data.key,
        name: data.name,
        description: data.description ?? null,
        type: data.type,
        enabled: data.enabled,
        rolloutPercentage: data.rolloutPercentage ?? 0,
        targetUserIds: data.targetUserIds ?? [],
        targetTeamIds: data.targetTeamIds ?? [],
      })
      .returning();

    invalidateCache();
    return NextResponse.json({ flag: created }, { status: 201 });
  } catch (err) {
    console.error('[api/feature-flags] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
