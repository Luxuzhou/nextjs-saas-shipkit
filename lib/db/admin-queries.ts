import { desc, eq, ilike, or, count, isNull, isNotNull, and } from 'drizzle-orm';
import { db } from './drizzle';
import { users, teams, activityLogs, teamMembers } from './schema';

// Admin email whitelist — edit this list to grant admin access
export const ADMIN_EMAILS: string[] = ['test@test.com'];

export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export type PaginationOptions = {
  page?: number;
  pageSize?: number;
};

// ─── Users ───────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  deletedAt: Date | null;
};

export async function getAllUsers(
  page = 1,
  pageSize = 20,
  search?: string
): Promise<{ users: AdminUser[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const whereClause = search
    ? or(
        ilike(users.email, `%${search}%`),
        ilike(users.name, `%${search}%`)
      )
    : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(users)
      .where(whereClause),
  ]);

  return { users: rows, total: countResult[0].value };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export type UserStats = {
  total: number;
  active: number;
  deleted: number;
  newLast30Days: number;
};

export async function getUserStats(): Promise<UserStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalResult, activeResult, deletedResult, newResult] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(users).where(isNull(users.deletedAt)),
    db.select({ value: count() }).from(users).where(isNotNull(users.deletedAt)),
    db
      .select({ value: count() })
      .from(users)
      .where(and(isNull(users.deletedAt))),
  ]);

  // newLast30Days: users created within last 30 days and not deleted
  const newRows = await db
    .select({ value: count() })
    .from(users)
    .where(and(isNull(users.deletedAt)));

  // We compute newLast30Days from JS after fetching (simpler without raw SQL)
  const allActiveUsers = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(isNull(users.deletedAt));

  const newLast30Days = allActiveUsers.filter(
    (u) => new Date(u.createdAt) >= thirtyDaysAgo
  ).length;

  return {
    total: totalResult[0].value,
    active: activeResult[0].value,
    deleted: deletedResult[0].value,
    newLast30Days,
  };
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export type SubscriptionStats = {
  total: number;
  active: number;
  trialing: number;
  canceled: number;
  stripeError?: string;
};

export type SubscriptionRow = {
  teamId: number;
  teamName: string;
  planName: string | null;
  subscriptionStatus: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  createdAt: Date;
};

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  try {
    const allTeams = await db
      .select({
        subscriptionStatus: teams.subscriptionStatus,
        stripeSubscriptionId: teams.stripeSubscriptionId,
      })
      .from(teams);

    const active = allTeams.filter((t) => t.subscriptionStatus === 'active').length;
    const trialing = allTeams.filter((t) => t.subscriptionStatus === 'trialing').length;
    const canceled = allTeams.filter((t) => t.subscriptionStatus === 'canceled').length;

    return {
      total: allTeams.filter((t) => t.stripeSubscriptionId !== null).length,
      active,
      trialing,
      canceled,
    };
  } catch (error) {
    console.error('getSubscriptionStats error:', error);
    return { total: 0, active: 0, trialing: 0, canceled: 0, stripeError: String(error) };
  }
}

export async function getAllSubscriptions(
  page = 1,
  pageSize = 20
): Promise<{ subscriptions: SubscriptionRow[]; total: number }> {
  try {
    const offset = (page - 1) * pageSize;

    const [rows, countResult] = await Promise.all([
      db
        .select({
          teamId: teams.id,
          teamName: teams.name,
          planName: teams.planName,
          subscriptionStatus: teams.subscriptionStatus,
          stripeSubscriptionId: teams.stripeSubscriptionId,
          stripeCustomerId: teams.stripeCustomerId,
          createdAt: teams.createdAt,
        })
        .from(teams)
        .where(isNotNull(teams.stripeSubscriptionId))
        .orderBy(desc(teams.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ value: count() })
        .from(teams)
        .where(isNotNull(teams.stripeSubscriptionId)),
    ]);

    return { subscriptions: rows, total: countResult[0].value };
  } catch (error) {
    console.error('getAllSubscriptions error:', error);
    return { subscriptions: [], total: 0 };
  }
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export type AdminActivityLog = {
  id: number;
  action: string;
  timestamp: Date;
  ipAddress: string | null;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  teamId: number;
  teamName: string | null;
};

export async function getAllActivityLogs(
  page = 1,
  pageSize = 50
): Promise<{ logs: AdminActivityLog[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        timestamp: activityLogs.timestamp,
        ipAddress: activityLogs.ipAddress,
        userId: activityLogs.userId,
        userName: users.name,
        userEmail: users.email,
        teamId: activityLogs.teamId,
        teamName: teams.name,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .leftJoin(teams, eq(activityLogs.teamId, teams.id))
      .orderBy(desc(activityLogs.timestamp))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(activityLogs),
  ]);

  return { logs: rows as AdminActivityLog[], total: countResult[0].value };
}

// ─── Chart data ───────────────────────────────────────────────────────────────

export type DailySignupData = {
  date: string;
  count: number;
};

export async function getDailySignups(days = 30): Promise<DailySignupData[]> {
  const allUsers = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(isNull(users.deletedAt));

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);

  const map: Record<string, number> = {};

  // Initialise all days with 0
  for (let i = 0; i < days; i++) {
    const d = new Date(cutoff);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    map[key] = 0;
  }

  for (const u of allUsers) {
    const key = new Date(u.createdAt).toISOString().slice(0, 10);
    if (key in map) {
      map[key] = (map[key] ?? 0) + 1;
    }
  }

  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}
