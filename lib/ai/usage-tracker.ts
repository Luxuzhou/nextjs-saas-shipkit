/**
 * AI Usage Tracker
 *
 * Provides functions to record and query AI token usage.
 *
 * Note: The aiUsageLogs and aiQuotas tables defined in lib/db/ai-schema.ts
 * have not yet been merged into the main Drizzle schema. Until Lead integrates
 * ai-schema.ts in the migration phase, direct DB queries against those tables
 * are wrapped in try/catch and fall back to mock data so the rest of the app
 * continues to function.
 */

import type { UsageRecord, MonthlyUsage, RemainingQuota } from './types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Returns the first day of the current calendar month (UTC). */
function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Returns the first day of the next calendar month (UTC). */
function startOfNextMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist a usage record to the database.
 * Falls back gracefully if the table does not yet exist.
 */
export async function trackUsage(record: UsageRecord): Promise<void> {
  try {
    // Lazy import so that missing table during dev does not break module load.
    const { db } = await import('@/lib/db/drizzle');
    const { aiUsageLogs } = await import('@/lib/db/ai-schema');

    await db.insert(aiUsageLogs).values({
      userId: record.userId,
      teamId: record.teamId ?? null,
      model: record.model,
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
      cost: record.cost,
      endpoint: record.endpoint,
    });
  } catch (err) {
    // Table may not exist yet — log and continue so chat endpoint is not blocked.
    console.warn('[usage-tracker] trackUsage failed (table may not exist yet):', err);
  }
}

/**
 * Retrieve raw usage logs for a user.
 * Returns mock data when the table does not yet exist.
 */
export async function getUsage(userId: number, limit = 20): Promise<UsageRecord[]> {
  try {
    const { db } = await import('@/lib/db/drizzle');
    const { aiUsageLogs } = await import('@/lib/db/ai-schema');
    const { desc, eq } = await import('drizzle-orm');

    const rows = await db
      .select()
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.userId, userId))
      .orderBy(desc(aiUsageLogs.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      userId: r.userId,
      teamId: r.teamId ?? undefined,
      model: r.model,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cost: r.cost,
      endpoint: r.endpoint ?? '/api/ai/chat',
    }));
  } catch {
    console.warn('[usage-tracker] getUsage: falling back to mock data');
    return getMockUsageRecords(userId);
  }
}

/**
 * Aggregate usage for the current calendar month for a given user.
 * Falls back to mock data when the table does not yet exist.
 */
export async function getMonthlyUsage(userId: number): Promise<MonthlyUsage> {
  try {
    const { db } = await import('@/lib/db/drizzle');
    const { aiUsageLogs } = await import('@/lib/db/ai-schema');
    const { gte, eq, and } = await import('drizzle-orm');

    const monthStart = startOfCurrentMonth();
    const rows = await db
      .select()
      .from(aiUsageLogs)
      .where(and(eq(aiUsageLogs.userId, userId), gte(aiUsageLogs.createdAt, monthStart)));

    return aggregateRows(rows);
  } catch {
    console.warn('[usage-tracker] getMonthlyUsage: falling back to mock data');
    return getMockMonthlyUsage();
  }
}

/**
 * Get remaining quota for a team.
 * Falls back to a default free-tier quota when the table does not yet exist.
 */
export async function getRemainingQuota(teamId: number): Promise<RemainingQuota> {
  try {
    const { db } = await import('@/lib/db/drizzle');
    const { aiQuotas } = await import('@/lib/db/ai-schema');
    const { eq } = await import('drizzle-orm');

    const rows = await db
      .select()
      .from(aiQuotas)
      .where(eq(aiQuotas.teamId, teamId))
      .limit(1);

    if (rows.length === 0) {
      // No quota row yet — treat as fresh free-tier account.
      return buildQuotaResult(0, 100_000, startOfNextMonth());
    }

    const q = rows[0];
    return buildQuotaResult(q.tokensUsed, q.monthlyTokenLimit, q.resetAt);
  } catch {
    console.warn('[usage-tracker] getRemainingQuota: falling back to mock quota');
    return buildQuotaResult(1_234, 100_000, startOfNextMonth());
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildQuotaResult(
  tokensUsed: number,
  monthlyTokenLimit: number,
  resetAt: Date
): RemainingQuota {
  const tokensRemaining = Math.max(0, monthlyTokenLimit - tokensUsed);
  const percentUsed =
    monthlyTokenLimit > 0 ? Math.min(100, (tokensUsed / monthlyTokenLimit) * 100) : 0;

  return {
    allowed: tokensRemaining > 0,
    tokensUsed,
    monthlyTokenLimit,
    tokensRemaining,
    percentUsed,
    resetAt,
  };
}

type UsageRow = {
  userId: number;
  teamId: number | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: string;
  endpoint: string | null;
  createdAt: Date;
};

function aggregateRows(rows: UsageRow[]): MonthlyUsage {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;
  const byModel: MonthlyUsage['byModel'] = {};
  const dailyMap: Record<string, { tokens: number; cost: number }> = {};

  for (const r of rows) {
    totalInputTokens += r.inputTokens;
    totalOutputTokens += r.outputTokens;
    const cost = parseFloat(r.cost) || 0;
    totalCost += cost;

    // By model
    if (!byModel[r.model]) {
      byModel[r.model] = { inputTokens: 0, outputTokens: 0, costUsd: '0' };
    }
    byModel[r.model].inputTokens += r.inputTokens;
    byModel[r.model].outputTokens += r.outputTokens;
    byModel[r.model].costUsd = (
      parseFloat(byModel[r.model].costUsd) + cost
    ).toFixed(6);

    // Daily
    const day = r.createdAt.toISOString().slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { tokens: 0, cost: 0 };
    dailyMap[day].tokens += r.inputTokens + r.outputTokens;
    dailyMap[day].cost += cost;
  }

  const dailyTotals = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, tokens: v.tokens, cost: v.cost.toFixed(6) }));

  return {
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    totalCostUsd: totalCost.toFixed(6),
    requestCount: rows.length,
    byModel,
    dailyTotals,
  };
}

// ---------------------------------------------------------------------------
// Mock data (used when DB tables are not yet migrated)
// ---------------------------------------------------------------------------

function getMockUsageRecords(userId: number): UsageRecord[] {
  return [
    {
      userId,
      model: 'deepseek-chat',
      inputTokens: 512,
      outputTokens: 256,
      cost: '0.000107',
      endpoint: '/api/ai/chat',
    },
    {
      userId,
      model: 'deepseek-chat',
      inputTokens: 1024,
      outputTokens: 512,
      cost: '0.000214',
      endpoint: '/api/ai/chat',
    },
  ];
}

function getMockMonthlyUsage(): MonthlyUsage {
  const today = new Date();
  const dailyTotals = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const tokens = Math.floor(Math.random() * 3000) + 500;
    return {
      date: d.toISOString().slice(0, 10),
      tokens,
      cost: ((tokens * 0.14) / 1_000_000).toFixed(6),
    };
  });

  return {
    totalInputTokens: 8_432,
    totalOutputTokens: 4_216,
    totalTokens: 12_648,
    totalCostUsd: '0.002972',
    requestCount: 15,
    byModel: {
      'deepseek-chat': {
        inputTokens: 8_432,
        outputTokens: 4_216,
        costUsd: '0.002972',
      },
    },
    dailyTotals,
  };
}
