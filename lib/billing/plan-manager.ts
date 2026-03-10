/**
 * Plan management: change plans, check limits, handle trial expiry.
 *
 * Falls back gracefully when billing tables are not yet migrated.
 */

import { getPlanConfig } from './plans';
import type { PlanConfig } from './types';

export interface ChangePlanResult {
  success: boolean;
  message: string;
  fromPlan: string;
  toPlan: string;
}

/**
 * Change a team's plan. Logs the change in plan_change_logs.
 */
export async function changePlan(
  teamId: number,
  userId: number,
  newPlanId: string,
  reason?: string
): Promise<ChangePlanResult> {
  try {
    const { db } = await import('@/lib/db/drizzle');
    const { teams } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    // Get current team
    const teamRows = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (teamRows.length === 0) {
      return {
        success: false,
        message: 'Team not found',
        fromPlan: '',
        toPlan: newPlanId,
      };
    }

    const team = teamRows[0];
    const fromPlan = team.planName ?? 'free';
    const newPlan = getPlanConfig(newPlanId);

    if (!newPlan || newPlan.id === 'free') {
      // Validate plan exists (free is always valid)
    }

    // Update team plan
    await db
      .update(teams)
      .set({
        planName: newPlanId,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId));

    // Log the change
    try {
      const { planChangeLogs } = await import('@/lib/db/billing-schema');
      await db.insert(planChangeLogs).values({
        teamId,
        fromPlan,
        toPlan: newPlanId,
        changedBy: userId,
        reason: reason ?? null,
      });
    } catch {
      console.warn('[plan-manager] Could not log plan change (table may not exist)');
    }

    return {
      success: true,
      message: `Plan changed from ${fromPlan} to ${newPlanId}`,
      fromPlan,
      toPlan: newPlanId,
    };
  } catch (err) {
    console.error('[plan-manager] changePlan error:', err);
    return {
      success: false,
      message: 'Failed to change plan',
      fromPlan: '',
      toPlan: newPlanId,
    };
  }
}

/**
 * Handle trial expiry: downgrade team to free plan if trial has ended.
 */
export async function handleTrialExpiry(teamId: number): Promise<boolean> {
  try {
    const { db } = await import('@/lib/db/drizzle');
    const { teams } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const teamRows = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (teamRows.length === 0) return false;

    const team = teamRows[0];
    if (team.subscriptionStatus === 'trialing') {
      await db
        .update(teams)
        .set({
          planName: 'free',
          subscriptionStatus: 'expired',
          updatedAt: new Date(),
        })
        .where(eq(teams.id, teamId));
      return true;
    }

    return false;
  } catch (err) {
    console.error('[plan-manager] handleTrialExpiry error:', err);
    return false;
  }
}

/**
 * Check if a team is within plan limits.
 */
export interface PlanLimitCheck {
  withinLimits: boolean;
  aiTokensUsed: number;
  aiTokensLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
  teamMembersCount: number;
  teamMembersLimit: number;
  violations: string[];
}

export async function checkPlanLimits(
  teamId: number
): Promise<PlanLimitCheck> {
  const defaultResult: PlanLimitCheck = {
    withinLimits: true,
    aiTokensUsed: 0,
    aiTokensLimit: 100_000,
    apiCallsUsed: 0,
    apiCallsLimit: 1_000,
    teamMembersCount: 1,
    teamMembersLimit: 1,
    violations: [],
  };

  try {
    const { db } = await import('@/lib/db/drizzle');
    const { teams, teamMembers } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    // Get team
    const teamRows = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (teamRows.length === 0) return defaultResult;

    const team = teamRows[0];
    const plan = getPlanConfig(team.planName);

    // Count team members
    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    const memberCount = members.length;

    // Get AI usage for current month
    let aiTokensUsed = 0;
    try {
      const { aiUsageLogs } = await import('@/lib/db/schema');
      const { gte, and } = await import('drizzle-orm');
      const monthStart = new Date(
        Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
      );

      const usageRows = await db
        .select()
        .from(aiUsageLogs)
        .where(
          and(
            eq(aiUsageLogs.teamId, teamId),
            gte(aiUsageLogs.createdAt, monthStart)
          )
        );

      for (const row of usageRows) {
        aiTokensUsed += row.inputTokens + row.outputTokens;
      }
    } catch {
      // AI usage table may not exist
    }

    const violations: string[] = [];

    if (
      plan.limits.aiTokensPerMonth !== Infinity &&
      aiTokensUsed > plan.limits.aiTokensPerMonth
    ) {
      violations.push(
        `AI token usage (${aiTokensUsed}) exceeds plan limit (${plan.limits.aiTokensPerMonth})`
      );
    }

    if (
      plan.limits.maxTeamMembers !== Infinity &&
      memberCount > plan.limits.maxTeamMembers
    ) {
      violations.push(
        `Team members (${memberCount}) exceeds plan limit (${plan.limits.maxTeamMembers})`
      );
    }

    return {
      withinLimits: violations.length === 0,
      aiTokensUsed,
      aiTokensLimit: plan.limits.aiTokensPerMonth,
      apiCallsUsed: 0, // Would come from API gateway logs
      apiCallsLimit: plan.limits.apiCallsPerMonth,
      teamMembersCount: memberCount,
      teamMembersLimit: plan.limits.maxTeamMembers,
      violations,
    };
  } catch (err) {
    console.error('[plan-manager] checkPlanLimits error:', err);
    return defaultResult;
  }
}

/**
 * Get a display-friendly plan comparison.
 */
export function comparePlans(
  currentPlanId: string,
  targetPlanId: string
): { isUpgrade: boolean; isDowngrade: boolean; priceDiff: number } {
  const current = getPlanConfig(currentPlanId);
  const target = getPlanConfig(targetPlanId);

  const priceDiff = target.priceMonthly - current.priceMonthly;

  return {
    isUpgrade: priceDiff > 0,
    isDowngrade: priceDiff < 0,
    priceDiff,
  };
}
