import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/api-gateway/middleware';
import { db } from '@/lib/db/drizzle';
import { aiUsageLogs, aiQuotas } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET = withApiAuth(async (_req, ctx) => {
  try {
    // Get quota
    const quotaResult = await db
      .select()
      .from(aiQuotas)
      .where(eq(aiQuotas.teamId, ctx.teamId))
      .limit(1);

    const quota = quotaResult.length > 0
      ? {
          plan: quotaResult[0].plan,
          monthlyTokenLimit: quotaResult[0].monthlyTokenLimit,
          tokensUsed: quotaResult[0].tokensUsed,
          resetAt: quotaResult[0].resetAt,
        }
      : null;

    // Get recent usage logs
    const recentLogs = await db
      .select({
        id: aiUsageLogs.id,
        model: aiUsageLogs.model,
        inputTokens: aiUsageLogs.inputTokens,
        outputTokens: aiUsageLogs.outputTokens,
        cost: aiUsageLogs.cost,
        createdAt: aiUsageLogs.createdAt,
      })
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.teamId, ctx.teamId))
      .orderBy(desc(aiUsageLogs.createdAt))
      .limit(50);

    return NextResponse.json({ quota, recentLogs });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    );
  }
}, 'read');
