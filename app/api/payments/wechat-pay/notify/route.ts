import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.text();
    const timestamp = request.headers.get('Wechatpay-Timestamp') || '';
    const nonce = request.headers.get('Wechatpay-Nonce') || '';
    const _signature = request.headers.get('Wechatpay-Signature') || '';

    if (!process.env.WECHAT_PAY_MCH_ID) {
      console.warn('[wechat-pay-notify] WECHAT_PAY_MCH_ID not configured, ignoring notification');
      return NextResponse.json(
        { code: 'SUCCESS', message: 'OK' },
        { status: 200 }
      );
    }

    // Parse the notification
    let notification: {
      event_type?: string;
      resource?: {
        ciphertext?: string;
        nonce?: string;
        associated_data?: string;
      };
    };

    try {
      notification = JSON.parse(body) as typeof notification;
    } catch {
      return NextResponse.json(
        { code: 'FAIL', message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const eventType = notification.event_type;
    console.log(
      `[wechat-pay-notify] Received event: ${eventType} timestamp=${timestamp} nonce=${nonce}`
    );

    if (eventType === 'TRANSACTION.SUCCESS') {
      // In production, decrypt the resource using AES-256-GCM
      // with the API v3 key, then update order/subscription status.
      console.log('[wechat-pay-notify] Payment success notification received');
    }

    // WeChat Pay expects this response format
    return NextResponse.json(
      { code: 'SUCCESS', message: 'OK' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[wechat-pay-notify] Error processing notification:', error);
    return NextResponse.json(
      { code: 'FAIL', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
