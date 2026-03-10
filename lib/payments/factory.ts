import type { PaymentProvider } from './types';
import { StripeProvider } from './providers/stripe';
import { LemonSqueezyProvider } from './providers/lemon-squeezy';
import { AlipayProvider } from './providers/alipay';
import { WechatPayProvider } from './providers/wechat-pay';

let cachedProvider: PaymentProvider | null = null;
let cachedProviderName: string | null = null;

export function getPaymentProvider(): PaymentProvider {
  const providerName = process.env.PAYMENT_PROVIDER || 'stripe';

  // Return cached instance if provider hasn't changed
  if (cachedProvider && cachedProviderName === providerName) {
    return cachedProvider;
  }

  switch (providerName) {
    case 'stripe':
      cachedProvider = new StripeProvider();
      break;
    case 'lemon-squeezy':
      cachedProvider = new LemonSqueezyProvider();
      break;
    case 'alipay':
      cachedProvider = new AlipayProvider();
      break;
    case 'wechat-pay':
      cachedProvider = new WechatPayProvider();
      break;
    default:
      console.warn(
        `Unknown PAYMENT_PROVIDER "${providerName}", falling back to Stripe`
      );
      cachedProvider = new StripeProvider();
      break;
  }

  cachedProviderName = providerName;
  return cachedProvider;
}
