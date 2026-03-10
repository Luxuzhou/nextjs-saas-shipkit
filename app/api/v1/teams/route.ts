import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/api-gateway/middleware';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withApiAuth(async (_req, ctx) => {
  try {
    const result = await db
      .select({
        id: teams.id,
        name: teams.name,
        planName: teams.planName,
        subscriptionStatus: teams.subscriptionStatus,
        createdAt: teams.createdAt,
      })
      .from(teams)
      .where(eq(teams.id, ctx.teamId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team info' },
      { status: 500 }
    );
  }
}, 'read');
