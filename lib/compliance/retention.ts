import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { dataRetentionPolicies } from '@/lib/db/compliance-schema';
import type { RetentionPolicyEntry } from './types';
import { DEFAULT_RETENTION } from './constants';
export { DEFAULT_RETENTION };

export async function setRetentionPolicy(params: {
  teamId: number;
  resource: string;
  retentionDays: number;
  isActive?: boolean;
}): Promise<RetentionPolicyEntry> {
  try {
    // Check if policy already exists
    const existing = await db
      .select()
      .from(dataRetentionPolicies)
      .where(
        and(
          eq(dataRetentionPolicies.teamId, params.teamId),
          eq(dataRetentionPolicies.resource, params.resource)
        )
      )
      .limit(1);

    const now = new Date();

    if (existing.length > 0) {
      const [updated] = await db
        .update(dataRetentionPolicies)
        .set({
          retentionDays: params.retentionDays,
          isActive: params.isActive ?? true,
          updatedAt: now,
        })
        .where(
          and(
            eq(dataRetentionPolicies.teamId, params.teamId),
            eq(dataRetentionPolicies.resource, params.resource)
          )
        )
        .returning();

      return updated as RetentionPolicyEntry;
    }

    const [created] = await db
      .insert(dataRetentionPolicies)
      .values({
        teamId: params.teamId,
        resource: params.resource,
        retentionDays: params.retentionDays,
        isActive: params.isActive ?? true,
      })
      .returning();

    return created as RetentionPolicyEntry;
  } catch (error) {
    console.warn('[retention] Failed to set retention policy:', error);
    throw new Error('Failed to set retention policy');
  }
}

export async function getRetentionPolicies(
  teamId: number
): Promise<RetentionPolicyEntry[]> {
  try {
    const rows = await db
      .select()
      .from(dataRetentionPolicies)
      .where(eq(dataRetentionPolicies.teamId, teamId));

    return rows as RetentionPolicyEntry[];
  } catch (error) {
    console.warn('[retention] Failed to get retention policies:', error);
    return [];
  }
}

export function getEffectiveRetentionDays(
  resource: string,
  policies: RetentionPolicyEntry[]
): number {
  const policy = policies.find((p) => p.resource === resource && p.isActive);
  if (policy) return policy.retentionDays;
  return DEFAULT_RETENTION[resource] ?? 365;
}
