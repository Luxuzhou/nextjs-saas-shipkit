import { NextResponse } from 'next/server';
import { verifyAlipaySignature } from '@/lib/payments/providers/alipay';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.text();

    // Parse URL-encoded body
    const params: Record<string, string> = {};
    const pairs = body.split('&');
    for (const pair of pairs) {
      const [key, ...rest] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(rest.join('='));
    }

    const signature = params['sign'] || '';

    if (!process.env.ALIPAY_APP_ID) {
      console.warn('[alipay-notify] ALIPAY_APP_ID not configured, ignoring notification');
      return new Response('success', { status: 200 });
    }

    const isValid = verifyAlipaySignature(params, signature);
    if (!isValid) {
      console.error('[alipay-notify] Invalid signature');
      return new Response('failure', { status: 400 });
    }

    const tradeStatus = params['trade_status'];
    const outTradeNo = params['out_trade_no'] || '';
    const tradeNo = params['trade_no'] || '';
    const totalAmount = params['total_amount'] || '0';

    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      console.log(
        `[alipay-notify] Payment success: order=${outTradeNo} trade=${tradeNo} amount=${totalAmount}`
      );

      // In production, update the order status in database
      // and potentially update the team's subscription
    }

    // Alipay expects 'success' as the response body
    return new Response('success', { status: 200 });
  } catch (error) {
    console.error('[alipay-notify] Error processing notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
