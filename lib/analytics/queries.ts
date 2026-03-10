import { db } from '@/lib/db/drizzle';
import { analyticsEvents, funnels } from '@/lib/db/analytics-schema';
import { and, eq, gte, lte, sql, desc, count } from 'drizzle-orm';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface EventCountByDate {
  date: string;
  count: number;
}

export interface TopEvent {
  eventName: string;
  count: number;
}

export interface PageViewEntry {
  pageUrl: string;
  count: number;
}

export interface RetentionRow {
  date: string;
  users: number;
}

export interface FunnelStep {
  name: string;
  eventName: string;
}

export interface FunnelConversionResult {
  steps: Array<{ name: string; users: number; rate: number }>;
}

export async function getEventsByDateRange(
  teamId: number,
  range: DateRange
): Promise<EventCountByDate[]> {
  try {
    const rows = await db
      .select({
        date: sql<string>`DATE(${analyticsEvents.timestamp})`,
        count: count(),
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.teamId, teamId),
          gte(analyticsEvents.timestamp, range.from),
          lte(analyticsEvents.timestamp, range.to)
        )
      )
      .groupBy(sql`DATE(${analyticsEvents.timestamp})`)
      .orderBy(sql`DATE(${analyticsEvents.timestamp})`);

    return rows.map((r) => ({ date: r.date, count: r.count }));
  } catch {
    return [];
  }
}

export async function getTopEvents(
  teamId: number,
  range: DateRange,
  limit = 10
): Promise<TopEvent[]> {
  try {
    const rows = await db
      .select({
        eventName: analyticsEvents.eventName,
        count: count(),
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.teamId, teamId),
          gte(analyticsEvents.timestamp, range.from),
          lte(analyticsEvents.timestamp, range.to)
        )
      )
      .groupBy(analyticsEvents.eventName)
      .orderBy(desc(count()))
      .limit(limit);

    return rows.map((r) => ({ eventName: r.eventName, count: r.count }));
  } catch {
    return [];
  }
}

export async function getPageViews(
  teamId: number,
  range: DateRange,
  limit = 10
): Promise<PageViewEntry[]> {
  try {
    const rows = await db
      .select({
        pageUrl: analyticsEvents.pageUrl,
        count: count(),
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.teamId, teamId),
          gte(analyticsEvents.timestamp, range.from),
          lte(analyticsEvents.timestamp, range.to)
        )
      )
      .groupBy(analyticsEvents.pageUrl)
      .orderBy(desc(count()))
      .limit(limit);

    return rows
      .filter((r) => r.pageUrl !== null)
      .map((r) => ({ pageUrl: r.pageUrl as string, count: r.count }));
  } catch {
    return [];
  }
}

export async function getUserRetention(
  teamId: number,
  range: DateRange
): Promise<RetentionRow[]> {
  try {
    const rows = await db
      .select({
        date: sql<string>`DATE(${analyticsEvents.timestamp})`,
        users: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.teamId, teamId),
          gte(analyticsEvents.timestamp, range.from),
          lte(analyticsEvents.timestamp, range.to)
        )
      )
      .groupBy(sql`DATE(${analyticsEvents.timestamp})`)
      .orderBy(sql`DATE(${analyticsEvents.timestamp})`);

    return rows.map((r) => ({ date: r.date, users: Number(r.users) }));
  } catch {
    return [];
  }
}

export async function getFunnelConversion(
  funnelId: number
): Promise<FunnelConversionResult> {
  try {
    const funnel = await db
      .select()
      .from(funnels)
      .where(eq(funnels.id, funnelId))
      .limit(1);

    if (funnel.length === 0) {
      return { steps: [] };
    }

    const steps = funnel[0].steps as FunnelStep[];
    const teamId = funnel[0].teamId;

    if (!steps || steps.length === 0) {
      return { steps: [] };
    }

    const results: Array<{ name: string; users: number; rate: number }> = [];
    let previousUsers = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const rows = await db
        .select({
          users: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})`,
        })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.teamId, teamId),
            eq(analyticsEvents.eventName, step.eventName)
          )
        );

      const users = Number(rows[0]?.users ?? 0);
      const rate = i === 0 ? 100 : previousUsers > 0 ? Math.round((users / previousUsers) * 100) : 0;
      results.push({ name: step.name, users, rate });
      previousUsers = users;
    }

    return { steps: results };
  } catch {
    return { steps: [] };
  }
}

export async function getTeamFunnels(teamId: number): Promise<typeof funnels.$inferSelect[]> {
  try {
    return await db
      .select()
      .from(funnels)
      .where(eq(funnels.teamId, teamId))
      .orderBy(desc(funnels.createdAt));
  } catch {
    return [];
  }
}
