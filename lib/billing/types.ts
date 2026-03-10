/**
 * Billing system types
 */

export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  priceMonthly: number; // USD cents
  priceYearly: number; // USD cents
  currency: string;
  features: string[];
  limits: PlanLimits;
}

export interface PlanLimits {
  aiTokensPerMonth: number;
  apiCallsPerMonth: number;
  maxTeamMembers: number;
  maxProjects: number;
  storageGb: number;
}

export interface BillingPeriod {
  start: Date;
  end: Date;
  month: string; // e.g. '2026-03'
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number; // USD cents
  total: number; // USD cents
}

export interface InvoiceSummary {
  id: number;
  teamId: number;
  periodStart: string;
  periodEnd: string;
  totalAmount: string;
  currency: string;
  status: string;
  pdfUrl: string | null;
  createdAt: string;
}

export interface CurrentBilling {
  plan: PlanConfig;
  period: BillingPeriod;
  aiTokensUsed: number;
  aiTokensLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
  estimatedCost: string;
  subscriptionStatus: string | null;
}

export interface UsageTier {
  name: string;
  upTo: number; // tokens
  pricePerMillion: number; // USD
}

export const USAGE_TIERS: UsageTier[] = [
  { name: 'Free Tier', upTo: 100_000, pricePerMillion: 0 },
  { name: 'Standard', upTo: 1_000_000, pricePerMillion: 0.50 },
  { name: 'High Volume', upTo: 10_000_000, pricePerMillion: 0.30 },
  { name: 'Enterprise', upTo: Infinity, pricePerMillion: 0.20 },
];
