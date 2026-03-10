/**
 * AI Usage Query Endpoint
 *
 * GET /api/ai/usage
 * Returns monthly usage stats and billing summary for the authenticated user.
 */

import { NextRequest } from 'next/server';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { getMonthlyUsage, getRemainingQuota } from '@/lib/ai/usage-tracker';
import { getMonthlyBill } from '@/lib/ai/billing';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest): Promise<Response> {
  // Authenticate
  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const userWithTeam = await getUserWithTeam(user.id);
    const teamId = userWithTeam?.teamId ?? null;

    const [monthlyUsage, bill, quota] = await Promise.all([
      getMonthlyUsage(user.id),
      getMonthlyBill(user.id),
      teamId !== null ? getRemainingQuota(teamId) : Promise.resolve(null),
    ]);

    return new Response(
      JSON.stringify({
        user: { id: user.id, name: user.name, email: user.email },
        monthlyUsage,
        bill,
        quota,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[usage] Failed to fetch usage data:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch usage data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
