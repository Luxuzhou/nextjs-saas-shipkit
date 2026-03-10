import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments/factory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Determine signature header based on provider
    const providerName = process.env.PAYMENT_PROVIDER || 'stripe';
    let signature: string | null = null;

    if (providerName === 'lemon-squeezy') {
      signature = request.headers.get('x-signature');
    } else {
      signature = request.headers.get('stripe-signature');
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    const provider = getPaymentProvider();
    const event = await provider.handleWebhook(body, signature);

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    console.error('Webhook error:', error);
    const message =
      error instanceof Error ? error.message : 'Webhook processing failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
