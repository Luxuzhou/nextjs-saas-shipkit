import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments/factory';
import { getUser, getTeamForUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { priceId } = body;

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      );
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const provider = getPaymentProvider();
    const url = await provider.createCheckoutSession({
      teamId: team.id,
      priceId,
      customerEmail: user.email,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Checkout error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
