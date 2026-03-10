import { NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments/factory';
import { getUser, getTeamForUser } from '@/lib/db/queries';

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (!team.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    const provider = getPaymentProvider();
    const url = await provider.createCustomerPortalSession(
      team.stripeCustomerId
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Portal session error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
