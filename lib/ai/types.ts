/**
 * Shared types for the AI usage tracking and billing system.
 */

/** Supported AI model identifiers */
export type AIModel = 'deepseek-chat' | 'deepseek-coder' | 'gpt-4o' | 'gpt-4o-mini';

/** A single usage record to be persisted */
export interface UsageRecord {
  userId: number;
  teamId?: number | null;
  model: AIModel | string;
  inputTokens: number;
  outputTokens: number;
  /** Cost in USD as a string to avoid floating-point drift */
  cost: string;
  endpoint: string;
}

/** Current quota state for a team */
export interface Quota {
  teamId: number;
  plan: string;
  monthlyTokenLimit: number;
  tokensUsed: number;
  resetAt: Date;
}

/** Aggregated monthly usage stats returned by getMonthlyUsage */
export interface MonthlyUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: string;
  requestCount: number;
  /** Usage broken down by model */
  byModel: Record<string, { inputTokens: number; outputTokens: number; costUsd: string }>;
  /** Daily totals for charts (ISO date string → token count) */
  dailyTotals: { date: string; tokens: number; cost: string }[];
}

/** Remaining quota information */
export interface RemainingQuota {
  allowed: boolean;
  tokensUsed: number;
  monthlyTokenLimit: number;
  tokensRemaining: number;
  percentUsed: number;
  resetAt: Date;
}

/** Per-model pricing configuration */
export interface ModelPricing {
  /** USD per 1 million input tokens */
  inputPricePerMillion: number;
  /** USD per 1 million output tokens */
  outputPricePerMillion: number;
}
