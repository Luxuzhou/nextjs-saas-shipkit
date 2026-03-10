import type {
  PaymentProvider,
  CheckoutParams,
  Product,
  Price,
  WebhookEvent,
} from '../types';

function assertConfigured(): void {
  if (!process.env.LEMON_SQUEEZY_API_KEY) {
    throw new Error(
      'LEMON_SQUEEZY_API_KEY is not configured. Set the environment variable to use Lemon Squeezy as your payment provider.'
    );
  }
  if (!process.env.LEMON_SQUEEZY_STORE_ID) {
    throw new Error(
      'LEMON_SQUEEZY_STORE_ID is not configured. Set the environment variable to use Lemon Squeezy as your payment provider.'
    );
  }
}

export class LemonSqueezyProvider implements PaymentProvider {
  async createCheckoutSession(params: CheckoutParams): Promise<string> {
    assertConfigured();

    // TODO: Implement using @lemonsqueezy/lemonsqueezy.js SDK
    // Expected flow:
    //   import { createCheckout, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
    //   lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API_KEY! });
    //   const checkout = await createCheckout(storeId, variantId, {
    //     checkoutData: { email: params.customerEmail },
    //     checkoutOptions: {
    //       successUrl: params.successUrl,
    //       cancelUrl: params.cancelUrl,
    //     },
    //   });
    //   return checkout.data.data.attributes.url;

    throw new Error(
      `LemonSqueezyProvider.createCheckoutSession not yet implemented (priceId: ${params.priceId})`
    );
  }

  async createCustomerPortalSession(customerId: string): Promise<string> {
    assertConfigured();

    // TODO: Implement using @lemonsqueezy/lemonsqueezy.js SDK
    // Lemon Squeezy provides a customer portal URL per subscription.
    // Expected flow:
    //   import { getSubscription, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
    //   lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API_KEY! });
    //   const subscription = await getSubscription(subscriptionId);
    //   return subscription.data.data.attributes.urls.customer_portal;

    throw new Error(
      `LemonSqueezyProvider.createCustomerPortalSession not yet implemented (customerId: ${customerId})`
    );
  }

  async handleWebhook(body: string, signature: string): Promise<WebhookEvent> {
    assertConfigured();

    // TODO: Implement webhook verification and handling
    // Lemon Squeezy signs webhooks with HMAC SHA-256.
    // Expected flow:
    //   import crypto from 'crypto';
    //   const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!);
    //   const digest = hmac.update(body).digest('hex');
    //   if (digest !== signature) throw new Error('Invalid signature');
    //   const event = JSON.parse(body);
    //   // Handle event.meta.event_name: 'subscription_created', 'subscription_updated', etc.

    throw new Error(
      `LemonSqueezyProvider.handleWebhook not yet implemented (signature: ${signature.substring(0, 8)}...)`
    );
  }

  async getProducts(): Promise<Product[]> {
    assertConfigured();

    // TODO: Implement using @lemonsqueezy/lemonsqueezy.js SDK
    // Expected flow:
    //   import { listProducts, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
    //   lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API_KEY! });
    //   const products = await listProducts({ filter: { storeId: process.env.LEMON_SQUEEZY_STORE_ID } });
    //   return products.data.data.map(p => ({
    //     id: p.id,
    //     name: p.attributes.name,
    //     description: p.attributes.description,
    //   }));

    throw new Error(
      'LemonSqueezyProvider.getProducts not yet implemented'
    );
  }

  async getPrices(): Promise<Price[]> {
    assertConfigured();

    // TODO: Implement using @lemonsqueezy/lemonsqueezy.js SDK
    // In Lemon Squeezy, prices are called "variants".
    // Expected flow:
    //   import { listVariants, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
    //   lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API_KEY! });
    //   const variants = await listVariants({ filter: { productId } });
    //   return variants.data.data.map(v => ({
    //     id: v.id,
    //     productId: v.attributes.product_id.toString(),
    //     unitAmount: v.attributes.price,
    //     currency: 'usd',
    //     interval: v.attributes.interval,
    //   }));

    throw new Error(
      'LemonSqueezyProvider.getPrices not yet implemented'
    );
  }
}
