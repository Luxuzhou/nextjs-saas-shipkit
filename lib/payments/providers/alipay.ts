/**
 * Alipay Payment Provider
 *
 * Implements the PaymentProvider interface for Alipay.
 * Uses RSA2 (SHA256WithRSA) signing without external SDK.
 *
 * Environment degradation: If ALIPAY_APP_ID is empty, all methods
 * return clear errors without affecting other providers.
 */

import type {
  PaymentProvider,
  CheckoutParams,
  Product,
  Price,
  WebhookEvent,
} from '../types';
import crypto from 'crypto';

function assertConfigured(): void {
  if (!process.env.ALIPAY_APP_ID) {
    throw new Error(
      'ALIPAY_APP_ID is not configured. Set the environment variable to use Alipay as your payment provider.'
    );
  }
  if (!process.env.ALIPAY_PRIVATE_KEY) {
    throw new Error(
      'ALIPAY_PRIVATE_KEY is not configured. Set the environment variable to use Alipay as your payment provider.'
    );
  }
}

/**
 * Build the sorted query string for Alipay signing.
 */
function buildSortedParams(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((key) => params[key] !== '' && params[key] !== undefined)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
}

/**
 * RSA2 (SHA256WithRSA) sign a string.
 */
function rsaSign(content: string, privateKey: string): string {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(content, 'utf8');
  sign.end();

  // Support both raw key and PEM formatted key
  const formattedKey = privateKey.includes('-----BEGIN')
    ? privateKey
    : `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;

  return sign.sign(formattedKey, 'base64');
}

/**
 * Verify Alipay RSA2 signature on a notification.
 */
export function verifyAlipaySignature(
  params: Record<string, string>,
  signature: string
): boolean {
  const publicKey = process.env.ALIPAY_PUBLIC_KEY;
  if (!publicKey) {
    console.warn('[alipay] ALIPAY_PUBLIC_KEY not configured, cannot verify signature');
    return false;
  }

  // Remove sign and sign_type from params before verification
  const filteredParams = { ...params };
  delete filteredParams['sign'];
  delete filteredParams['sign_type'];

  const content = buildSortedParams(filteredParams);

  const formattedKey = publicKey.includes('-----BEGIN')
    ? publicKey
    : `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;

  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(content, 'utf8');
  verify.end();

  try {
    return verify.verify(formattedKey, signature, 'base64');
  } catch {
    console.error('[alipay] Signature verification failed');
    return false;
  }
}

export class AlipayProvider implements PaymentProvider {
  private getBaseParams(): Record<string, string> {
    return {
      app_id: process.env.ALIPAY_APP_ID!,
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date()
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19),
      version: '1.0',
      format: 'JSON',
    };
  }

  async createCheckoutSession(params: CheckoutParams): Promise<string> {
    assertConfigured();

    const notifyUrl =
      process.env.ALIPAY_NOTIFY_URL ||
      `${process.env.BASE_URL}/api/payments/alipay/notify`;

    const bizContent = JSON.stringify({
      out_trade_no: `order_${params.teamId}_${Date.now()}`,
      total_amount: params.priceId, // For Alipay, priceId carries the amount
      subject: 'SaaS Subscription',
      product_code: 'FAST_INSTANT_TRADE_PAY',
    });

    const requestParams: Record<string, string> = {
      ...this.getBaseParams(),
      method: 'alipay.trade.page.pay',
      notify_url: notifyUrl,
      return_url:
        params.successUrl || `${process.env.BASE_URL}/dashboard/billing`,
      biz_content: bizContent,
    };

    const signContent = buildSortedParams(requestParams);
    const signature = rsaSign(signContent, process.env.ALIPAY_PRIVATE_KEY!);

    // Build the full redirect URL
    const allParams = { ...requestParams, sign: signature };
    const queryString = Object.entries(allParams)
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
      )
      .join('&');

    const gateway = 'https://openapi.alipay.com/gateway.do';
    return `${gateway}?${queryString}`;
  }

  async createCustomerPortalSession(_customerId: string): Promise<string> {
    assertConfigured();
    // Alipay does not have a customer portal equivalent.
    // Redirect to the billing page instead.
    return `${process.env.BASE_URL}/dashboard/billing`;
  }

  async handleWebhook(body: string, _signature: string): Promise<WebhookEvent> {
    assertConfigured();

    const params: Record<string, string> = {};
    const pairs = body.split('&');
    for (const pair of pairs) {
      const [key, ...rest] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(rest.join('='));
    }

    const sign = params['sign'] || '';
    const isValid = verifyAlipaySignature(params, sign);

    if (!isValid) {
      throw new Error('Invalid Alipay webhook signature');
    }

    const tradeStatus = params['trade_status'] || '';
    let eventType = 'alipay.trade.unknown';

    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      eventType = 'alipay.trade.success';
    } else if (tradeStatus === 'TRADE_CLOSED') {
      eventType = 'alipay.trade.closed';
    } else if (tradeStatus === 'WAIT_BUYER_PAY') {
      eventType = 'alipay.trade.pending';
    }

    return {
      type: eventType,
      data: params as unknown as Record<string, unknown>,
    };
  }

  async getProducts(): Promise<Product[]> {
    assertConfigured();
    // Alipay does not have a product catalog API.
    // Return empty — products are managed in our own database.
    return [];
  }

  async getPrices(): Promise<Price[]> {
    assertConfigured();
    // Alipay does not have a price catalog API.
    return [];
  }
}
