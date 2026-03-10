/**
 * AI Billing Logic
 *
 * Calculates per-request costs and monthly bills based on token usage.
 */

import type { ModelPricing, MonthlyUsage } from './types';
import { getMonthlyUsage } from './usage-tracker';

// ---------------------------------------------------------------------------
// Pricing table (USD per 1 million tokens)
// ---------------------------------------------------------------------------

/**
 * Model pricing catalogue.
 * Prices are illustrative — update when official pricing changes.
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'deepseek-chat': {
    inputPricePerMillion: 0.14,
    outputPricePerMillion: 0.28,
  },
  'deepseek-coder': {
    inputPricePerMillion: 0.14,
    outputPricePerMillion: 0.28,
  },
  'gpt-4o': {
    inputPricePerMillion: 5.0,
    outputPricePerMillion: 15.0,
  },
  'gpt-4o-mini': {
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
  },
};

/** Fallback pricing when a model is not in the catalogue. */
const FALLBACK_PRICING: ModelPricing = {
  inputPricePerMillion: 1.0,
  outputPricePerMillion: 2.0,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the USD cost for a single API call.
 * Returns cost as a fixed-precision string (6 decimal places).
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): string {
  const pricing = MODEL_PRICING[model] ?? FALLBACK_PRICING;

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMillion;

  return (inputCost + outputCost).toFixed(6);
}

export interface MonthlyBill {
  userId: number;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  totalCostUsd: string;
  totalTokens: number;
  requestCount: number;
  breakdown: MonthlyUsage['byModel'];
  currency: 'USD';
}

/**
 * Build a monthly billing summary for a user.
 */
export async function getMonthlyBill(userId: number): Promise<MonthlyBill> {
  const usage = await getMonthlyUsage(userId);

  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);

  return {
    userId,
    periodStart,
    periodEnd,
    totalCostUsd: usage.totalCostUsd,
    totalTokens: usage.totalTokens,
    requestCount: usage.requestCount,
    breakdown: usage.byModel,
    currency: 'USD',
  };
}
