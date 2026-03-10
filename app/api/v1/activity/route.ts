import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/api-gateway/middleware';
import { db } from '@/lib/db/drizzle';
import { activityLogs, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET = withApiAuth(async (req: NextRequest, ctx) => {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam ?? '50', 10) || 50, 1), 200);

    const logs = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        timestamp: activityLogs.timestamp,
        ipAddress: activityLogs.ipAddress,
        userName: users.name,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.teamId, ctx.teamId))
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}, 'read');
