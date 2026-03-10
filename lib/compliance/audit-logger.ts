import { and, desc, eq, gte, lte, count } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, teams } from '@/lib/db/schema';
import { auditLogs } from '@/lib/db/compliance-schema';
import type { AuditLogFilter, AuditLogEntry } from './types';
import { AuditAction, AuditResource } from './types';

export interface LogAuditParams {
  teamId?: number;
  userId?: number;
  action: AuditAction | string;
  resource: AuditResource | string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      teamId: params.teamId ?? null,
      userId: params.userId ?? null,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId ?? null,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
  } catch (error) {
    // Gracefully handle DB table not existing yet
    console.warn('[audit-logger] Failed to write audit log:', error);
  }
}

export async function getAuditLogs(
  filter: AuditLogFilter = {}
): Promise<{ logs: AuditLogEntry[]; total: number }> {
  try {
    const { page = 1, pageSize = 50 } = filter;
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (filter.userId !== undefined) {
      conditions.push(eq(auditLogs.userId, filter.userId));
    }
    if (filter.teamId !== undefined) {
      conditions.push(eq(auditLogs.teamId, filter.teamId));
    }
    if (filter.action) {
      conditions.push(eq(auditLogs.action, filter.action));
    }
    if (filter.resource) {
      conditions.push(eq(auditLogs.resource, filter.resource));
    }
    if (filter.startDate) {
      conditions.push(gte(auditLogs.createdAt, filter.startDate));
    }
    if (filter.endDate) {
      conditions.push(lte(auditLogs.createdAt, filter.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: auditLogs.id,
          teamId: auditLogs.teamId,
          userId: auditLogs.userId,
          action: auditLogs.action,
          resource: auditLogs.resource,
          resourceId: auditLogs.resourceId,
          oldValue: auditLogs.oldValue,
          newValue: auditLogs.newValue,
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
          createdAt: auditLogs.createdAt,
          userEmail: users.email,
          teamName: teams.name,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .leftJoin(teams, eq(auditLogs.teamId, teams.id))
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ value: count() }).from(auditLogs).where(whereClause),
    ]);

    return { logs: rows as AuditLogEntry[], total: countResult[0].value };
  } catch (error) {
    console.warn('[audit-logger] Failed to query audit logs:', error);
    return { logs: [], total: 0 };
  }
}

/**
 * Higher-order function that wraps an async function and logs an audit entry
 * before and after execution.
 */
export function withAuditLog<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  getMeta: (...args: TArgs) => Omit<LogAuditParams, 'oldValue' | 'newValue'>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const meta = getMeta(...args);
    const result = await fn(...args);
    await logAudit({
      ...meta,
      newValue: result,
    });
    return result;
  };
}

export { AuditAction, AuditResource };
