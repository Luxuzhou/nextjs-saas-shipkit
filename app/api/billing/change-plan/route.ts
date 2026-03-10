import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { changePlan } from '@/lib/billing/plan-manager';
import { PLAN_CONFIGS } from '@/lib/billing/plans';

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const body = (await request.json()) as { planId?: string; reason?: string };
    const { planId, reason } = body;

    if (!planId || !PLAN_CONFIGS[planId]) {
      return NextResponse.json(
        { error: 'Invalid plan ID. Valid plans: ' + Object.keys(PLAN_CONFIGS).join(', ') },
        { status: 400 }
      );
    }

    const result = await changePlan(team.id, user.id, planId, reason);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[billing/change-plan] Error:', error);
    return NextResponse.json(
      { error: 'Failed to change plan' },
      { status: 500 }
    );
  }
}
