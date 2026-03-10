import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getPlanConfig } from '@/lib/billing/plans';
import { getCurrentBillingPeriod } from '@/lib/billing/invoice-generator';
import { checkPlanLimits } from '@/lib/billing/plan-manager';
import type { CurrentBilling } from '@/lib/billing/types';

export async function GET(): Promise<Response> {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const plan = getPlanConfig(team.planName);
    const period = getCurrentBillingPeriod();
    const limits = await checkPlanLimits(team.id);

    // Estimate cost: base plan + overage
    const baseCost = plan.priceMonthly / 100; // Convert cents to dollars
    const estimatedCost = baseCost.toFixed(2);

    const billing: CurrentBilling = {
      plan,
      period,
      aiTokensUsed: limits.aiTokensUsed,
      aiTokensLimit: limits.aiTokensLimit,
      apiCallsUsed: limits.apiCallsUsed,
      apiCallsLimit: limits.apiCallsLimit,
      estimatedCost,
      subscriptionStatus: team.subscriptionStatus,
    };

    return NextResponse.json(billing);
  } catch (error) {
    console.error('[billing/current] Error:', error);
    // Return mock data on failure (environment degradation)
    const plan = getPlanConfig('free');
    const period = getCurrentBillingPeriod();

    return NextResponse.json({
      plan,
      period,
      aiTokensUsed: 0,
      aiTokensLimit: plan.limits.aiTokensPerMonth,
      apiCallsUsed: 0,
      apiCallsLimit: plan.limits.apiCallsPerMonth,
      estimatedCost: '0.00',
      subscriptionStatus: null,
    });
  }
}
