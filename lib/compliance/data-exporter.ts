import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, teams, activityLogs, teamMembers } from '@/lib/db/schema';
import { dataExportRequests } from '@/lib/db/compliance-schema';
import type { DataExportType, ExportStatus, ExportHistoryEntry } from './types';
import { stringify } from 'csv-stringify/sync';

export async function requestExport(params: {
  userId: number;
  teamId?: number;
  type: DataExportType;
}): Promise<{ id: number }> {
  try {
    // Expire 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [row] = await db
      .insert(dataExportRequests)
      .values({
        userId: params.userId,
        teamId: params.teamId ?? null,
        type: params.type,
        status: 'pending' as ExportStatus,
        expiresAt,
      })
      .returning({ id: dataExportRequests.id });

    return { id: row.id };
  } catch (error) {
    console.warn('[data-exporter] Failed to create export request:', error);
    throw new Error('Failed to create export request');
  }
}

export async function processExport(exportId: number): Promise<string> {
  let exportRow;

  try {
    const rows = await db
      .select()
      .from(dataExportRequests)
      .where(eq(dataExportRequests.id, exportId))
      .limit(1);

    exportRow = rows[0];
  } catch (error) {
    throw new Error(`Failed to fetch export request: ${error}`);
  }

  if (!exportRow) {
    throw new Error(`Export request ${exportId} not found`);
  }

  // Mark as processing
  try {
    await db
      .update(dataExportRequests)
      .set({ status: 'processing' as ExportStatus })
      .where(eq(dataExportRequests.id, exportId));
  } catch {
    // non-fatal
  }

  try {
    const csvContent = await generateCsvForType(
      exportRow.type as DataExportType,
      exportRow.userId,
      exportRow.teamId ?? undefined
    );

    // In a real system, upload to storage and return URL.
    // Here we embed the CSV as a data URL for demo purposes.
    const fileUrl = `data:text/csv;base64,${Buffer.from(csvContent).toString('base64')}`;

    const now = new Date();
    await db
      .update(dataExportRequests)
      .set({
        status: 'completed' as ExportStatus,
        fileUrl,
        completedAt: now,
      })
      .where(eq(dataExportRequests.id, exportId));

    return fileUrl;
  } catch (error) {
    await db
      .update(dataExportRequests)
      .set({ status: 'failed' as ExportStatus })
      .where(eq(dataExportRequests.id, exportId));
    throw error;
  }
}

async function generateCsvForType(
  type: DataExportType,
  userId: number,
  teamId?: number
): Promise<string> {
  switch (type) {
    case 'user_data': {
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      return stringify(rows, { header: true });
    }

    case 'team_data': {
      if (!teamId) return stringify([], { header: true });

      const rows = await db
        .select({
          teamId: teams.id,
          teamName: teams.name,
          planName: teams.planName,
          subscriptionStatus: teams.subscriptionStatus,
          createdAt: teams.createdAt,
          memberEmail: users.email,
          memberName: users.name,
          memberRole: teamMembers.role,
          memberJoinedAt: teamMembers.joinedAt,
        })
        .from(teams)
        .leftJoin(teamMembers, eq(teamMembers.teamId, teams.id))
        .leftJoin(users, eq(users.id, teamMembers.userId))
        .where(eq(teams.id, teamId));

      return stringify(rows, { header: true });
    }

    case 'activity_data': {
      const whereClause = teamId
        ? eq(activityLogs.teamId, teamId)
        : eq(activityLogs.userId, userId);

      const rows = await db
        .select({
          id: activityLogs.id,
          action: activityLogs.action,
          timestamp: activityLogs.timestamp,
          ipAddress: activityLogs.ipAddress,
          userId: activityLogs.userId,
          teamId: activityLogs.teamId,
        })
        .from(activityLogs)
        .where(whereClause)
        .orderBy(desc(activityLogs.timestamp))
        .limit(10000);

      return stringify(rows, { header: true });
    }

    case 'billing_data': {
      if (!teamId) return stringify([], { header: true });

      const rows = await db
        .select({
          teamId: teams.id,
          teamName: teams.name,
          planName: teams.planName,
          subscriptionStatus: teams.subscriptionStatus,
          stripeCustomerId: teams.stripeCustomerId,
          stripeSubscriptionId: teams.stripeSubscriptionId,
        })
        .from(teams)
        .where(eq(teams.id, teamId));

      return stringify(rows, { header: true });
    }

    case 'full_export': {
      // Combine user data + activity data
      const [userRows, activityRows] = await Promise.all([
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, userId)),
        db
          .select({
            id: activityLogs.id,
            action: activityLogs.action,
            timestamp: activityLogs.timestamp,
            ipAddress: activityLogs.ipAddress,
          })
          .from(activityLogs)
          .where(eq(activityLogs.userId, userId))
          .orderBy(desc(activityLogs.timestamp))
          .limit(10000),
      ]);

      const userCsv = stringify(userRows, { header: true });
      const activityCsv = stringify(activityRows, { header: true });

      return `## USER DATA\n${userCsv}\n\n## ACTIVITY LOGS\n${activityCsv}`;
    }

    default:
      return stringify([], { header: true });
  }
}

export async function getExportHistory(
  userId: number,
  teamId?: number
): Promise<ExportHistoryEntry[]> {
  try {
    const whereClause = eq(dataExportRequests.userId, userId);

    const rows = await db
      .select()
      .from(dataExportRequests)
      .where(whereClause)
      .orderBy(desc(dataExportRequests.requestedAt))
      .limit(50);

    return rows as ExportHistoryEntry[];
  } catch (error) {
    console.warn('[data-exporter] Failed to get export history:', error);
    return [];
  }
}
