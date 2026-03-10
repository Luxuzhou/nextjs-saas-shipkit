import type {
  PaymentProvider,
  CheckoutParams,
  Product,
  Price,
  WebhookEvent,
} from '../types';
import {
  stripe,
  getStripePrices,
  getStripeProducts,
  handleSubscriptionChange,
} from '../stripe';
import { getTeamForUser } from '@/lib/db/queries';

export class StripeProvider implements PaymentProvider {
  async createCheckoutSession(params: CheckoutParams): Promise<string> {
    try {
      const team = await getTeamForUser();
      if (!team) {
        throw new Error('Team not found');
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url:
          params.successUrl ||
          `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: params.cancelUrl || `${process.env.BASE_URL}/pricing`,
        customer: team.stripeCustomerId || undefined,
        customer_email: team.stripeCustomerId
          ? undefined
          : params.customerEmail,
        allow_promotion_codes: true,
        subscription_data: {
          trial_period_days: 14,
        },
      });

      if (!session.url) {
        throw new Error('Failed to create checkout session URL');
      }

      return session.url;
    } catch (error) {
      console.error('Stripe createCheckoutSession error:', error);
      throw error;
    }
  }

  async createCustomerPortalSession(customerId: string): Promise<string> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.BASE_URL}/dashboard`,
      });

      return session.url;
    } catch (error) {
      console.error('Stripe createCustomerPortalSession error:', error);
      throw error;
    }
  }

  async handleWebhook(body: string, signature: string): Promise<WebhookEvent> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
      }

      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );

      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data
            .object as import('stripe').default.Subscription;
          await handleSubscriptionChange(subscription);
          break;
        }
      }

      return {
        type: event.type,
        data: event.data.object as unknown as Record<string, unknown>,
      };
    } catch (error) {
      console.error('Stripe handleWebhook error:', error);
      throw error;
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      return await getStripeProducts();
    } catch (error) {
      console.error('Stripe getProducts error:', error);
      return [];
    }
  }

  async getPrices(): Promise<Price[]> {
    try {
      return await getStripePrices();
    } catch (error) {
      console.error('Stripe getPrices error:', error);
      return [];
    }
  }
}
