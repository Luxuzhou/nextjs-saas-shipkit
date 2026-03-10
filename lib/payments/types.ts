export interface CheckoutParams {
  teamId: number;
  priceId: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  defaultPriceId?: string;
}

export interface Price {
  id: string;
  productId: string;
  unitAmount: number | null;
  currency: string;
  interval?: string;
  trialPeriodDays?: number | null;
}

export interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface PaymentProvider {
  createCheckoutSession(params: CheckoutParams): Promise<string>;
  createCustomerPortalSession(customerId: string): Promise<string>;
  handleWebhook(body: string, signature: string): Promise<WebhookEvent>;
  getProducts(): Promise<Product[]>;
  getPrices(): Promise<Price[]>;
}
